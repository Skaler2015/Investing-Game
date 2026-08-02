/**
 * Persistence abstraction.
 *
 * The game persists its serialisable state through a `StorageAdapter`. The
 * default `LocalStorageAdapter` keeps everything on-device, which makes the
 * game fully playable offline with zero backend. To move to a cloud database
 * (Supabase, Firebase, a custom API, …) implement this same interface and
 * swap the exported `storage` — nothing else in the app needs to change.
 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private namespace = 'invest-master') {}

  private k(key: string) {
    return `${this.namespace}:${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(this.k(key));
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(this.k(key), JSON.stringify(value));
    } catch {
      /* quota / private-mode failures are non-fatal for a game */
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.k(key));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Example cloud adapter stub. Left here as a documented extension point so a
 * real backend can be dropped in later. It is intentionally not wired up.
 *
 * export class ApiStorageAdapter implements StorageAdapter {
 *   constructor(private baseUrl: string, private token: string) {}
 *   async get<T>(key: string) {
 *     const res = await fetch(`${this.baseUrl}/state/${key}`, {
 *       headers: { Authorization: `Bearer ${this.token}` },
 *     });
 *     return res.ok ? ((await res.json()) as T) : null;
 *   }
 *   // ...set / remove
 * }
 */

export const storage: StorageAdapter = new LocalStorageAdapter();
