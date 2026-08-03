/**
 * Unified persistence layer.
 *
 * The game reaches auth + saved-progress exclusively through `persistence`.
 * On boot it probes `/api/health.php`:
 *   - reachable  -> SERVER mode: accounts + snapshots live in the shared MySQL
 *                   database (cross-device, owned centrally).
 *   - unreachable-> LOCAL  mode: falls back to the on-device implementations
 *                   (services/auth.ts + services/storage.ts) so the game keeps
 *                   working offline exactly as before.
 *
 * Server writes are debounced (the store calls save() very frequently), while
 * a local copy is always written immediately as an offline cache.
 */
import { apiFetch, getToken, setToken, type ApiUser } from './api';
import { auth, type AuthUser, type AuthResult } from './auth';
import { storage } from './storage';
import { STORAGE_SNAPSHOT_KEY } from '../store/constants';

export type { AuthUser, AuthResult } from './auth';

/** A row in the shared global leaderboard. */
export interface LeaderRow {
  id: string;
  name: string;
  netWorth: number;
  weekGain: number;
}

type Mode = 'unknown' | 'server' | 'local';

function toUser(u: ApiUser): AuthUser {
  return { id: u.id, email: u.email, name: u.name, isGuest: false };
}

/** Turn a thrown Error message into a friendly, user-facing string. */
function friendly(e: unknown, fallback: string): string {
  const msg = e instanceof Error ? e.message : '';
  if (msg === 'network' || msg === 'unavailable' || msg === 'bad-response') {
    return 'Could not reach the server. Please try again.';
  }
  return msg || fallback;
}

class Persistence {
  private mode: Mode = 'unknown';
  private saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pending = new Map<string, unknown>();

  /** True once we've decided; safe to call anytime. */
  isServer(): boolean {
    return this.mode === 'server';
  }

  /** Probe the backend once and lock in server vs local mode. */
  async init(): Promise<void> {
    if (this.mode !== 'unknown') return;
    try {
      const res = await apiFetch<{ ok: boolean; db?: boolean }>('health.php', { timeout: 6000 });
      this.mode = res && res.db ? 'server' : 'local';
    } catch {
      this.mode = 'local';
    }
  }

  // ---- auth ---------------------------------------------------------------

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.mode === 'server') {
      if (!getToken()) return null;
      try {
        const res = await apiFetch<{ user: ApiUser }>('me.php');
        return toUser(res.user);
      } catch {
        // token invalid/expired — clear it so the app shows the sign-in gate.
        setToken(null);
        return null;
      }
    }
    return auth.getCurrentUser();
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    if (this.mode === 'server') {
      try {
        const res = await apiFetch<{ token: string; user: ApiUser }>('signup.php', {
          method: 'POST',
          body: { email, password },
        });
        setToken(res.token);
        return { ok: true, message: 'Account created', user: toUser(res.user) };
      } catch (e) {
        return { ok: false, message: friendly(e, 'Could not create account') };
      }
    }
    return auth.signUp(email, password);
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    if (this.mode === 'server') {
      try {
        const res = await apiFetch<{ token: string; user: ApiUser }>('login.php', {
          method: 'POST',
          body: { email, password },
        });
        setToken(res.token);
        return { ok: true, message: 'Signed in', user: toUser(res.user) };
      } catch (e) {
        return { ok: false, message: friendly(e, 'Could not sign in') };
      }
    }
    return auth.signIn(email, password);
  }

  async updateName(name: string): Promise<AuthUser | null> {
    if (this.mode === 'server') {
      try {
        const res = await apiFetch<{ user: ApiUser }>('updatename.php', {
          method: 'POST',
          body: { name },
        });
        return toUser(res.user);
      } catch {
        return null;
      }
    }
    return auth.updateName(name);
  }

  async signOut(): Promise<void> {
    if (this.mode === 'server') {
      try {
        await apiFetch('logout.php', { method: 'POST' });
      } catch {
        /* best-effort */
      }
      setToken(null);
      return;
    }
    return auth.signOut();
  }

  // ---- snapshots ----------------------------------------------------------

  /** On-device key. Matches the pre-backend layout so old local saves survive. */
  private localKey(userId: string): string {
    return `${STORAGE_SNAPSHOT_KEY}:${userId}`;
  }

  async loadSnapshot<T>(userId: string): Promise<T | null> {
    if (this.mode === 'server') {
      try {
        const res = await apiFetch<{ snapshot: T | null }>('load.php');
        if (res.snapshot != null) return res.snapshot;
      } catch {
        /* fall through to any local cache */
      }
      return storage.get<T>(this.localKey(userId));
    }
    return storage.get<T>(this.localKey(userId));
  }

  /**
   * Persist a snapshot. Local mode writes straight through; server mode caches
   * locally at once and debounces the network write so frequent save() calls
   * don't flood the API.
   */
  saveSnapshot<T>(userId: string, snapshot: T): void {
    if (this.mode === 'server') {
      void storage.set(this.localKey(userId), snapshot); // instant offline cache
      this.pending.set(userId, snapshot);
      const existing = this.saveTimers.get(userId);
      if (existing) clearTimeout(existing);
      this.saveTimers.set(
        userId,
        setTimeout(() => this.flush(userId), 8000)
      );
      return;
    }
    void storage.set(this.localKey(userId), snapshot);
  }

  private async flush(userId: string): Promise<void> {
    this.saveTimers.delete(userId);
    const snapshot = this.pending.get(userId);
    if (snapshot === undefined) return;
    this.pending.delete(userId);
    try {
      await apiFetch('save.php', { method: 'POST', body: { snapshot } });
    } catch {
      // Keep it queued so the next save() retries; local cache already holds it.
      this.pending.set(userId, snapshot);
    }
  }

  // ---- leaderboard --------------------------------------------------------

  /**
   * Publish the player's net worth to the shared board and return the live
   * standings. Returns null in local mode or on error (caller falls back to
   * the offline simulated leaderboard).
   */
  async publishScore(
    netWorth: number,
    weekGain: number,
    name: string
  ): Promise<{ top: LeaderRow[]; rank: number; total: number } | null> {
    if (this.mode !== 'server') return null;
    try {
      const res = await apiFetch<{ top: LeaderRow[]; rank: number; total: number }>('leaderboard.php', {
        method: 'POST',
        body: { netWorth: Math.round(netWorth), weekGain, name },
      });
      return { top: res.top ?? [], rank: res.rank ?? 0, total: res.total ?? 0 };
    } catch {
      return null;
    }
  }

  /**
   * Publish the player's net worth to this week's league and return the live
   * weekly standings + countdown. Null in local mode / on error.
   */
  async publishWeekly(
    netWorth: number,
    name: string
  ): Promise<{ top: LeaderRow[]; rank: number; total: number; endsIn: number } | null> {
    if (this.mode !== 'server') return null;
    try {
      const res = await apiFetch<{ top: LeaderRow[]; rank: number; total: number; endsIn: number }>(
        'weekly.php',
        { method: 'POST', body: { netWorth: Math.round(netWorth), name } }
      );
      return { top: res.top ?? [], rank: res.rank ?? 0, total: res.total ?? 0, endsIn: res.endsIn ?? 0 };
    } catch {
      return null;
    }
  }

  async removeSnapshot(userId: string): Promise<void> {
    if (this.mode === 'server') {
      this.pending.delete(userId);
      await storage.remove(this.localKey(userId));
      try {
        // Overwrite the server copy with a fresh/empty marker via save on next tick.
        await apiFetch('save.php', { method: 'POST', body: { snapshot: null } });
      } catch {
        /* ignore */
      }
      return;
    }
    return storage.remove(this.localKey(userId));
  }
}

export const persistence = new Persistence();
