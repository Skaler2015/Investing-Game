/**
 * Authentication abstraction.
 *
 * The app talks to auth exclusively through the `AuthProvider` interface, so
 * this on-device implementation can later be swapped for a real identity
 * provider (Firebase Auth, Supabase Auth, a custom JWT backend, …) without
 * touching UI or game logic.
 *
 * `LocalAuthProvider` implements email + password accounts stored on the
 * device. Passwords are never stored in plain text — they are salted and
 * hashed (SHA-256) before being persisted. This is appropriate for an
 * offline, single-device simulation game; moving to real cross-device
 * accounts only requires a new AuthProvider implementation.
 */
import { storage } from './storage';
import { uid } from '../utils/id';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isGuest: boolean;
}

export interface AuthResult {
  ok: boolean;
  message: string;
  user?: AuthUser;
}

export interface AuthProvider {
  getCurrentUser(): Promise<AuthUser | null>;
  signUp(email: string, password: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  updateName(name: string): Promise<AuthUser | null>;
  signOut(): Promise<void>;
  onChange(cb: (user: AuthUser | null) => void): () => void;
}

interface AccountRecord {
  id: string;
  email: string;
  name: string;
  saltHex: string;
  hashHex: string;
  createdAt: number;
}

const ACCOUNTS_KEY = 'accounts';
const SESSION_KEY = 'session-user';

function toHex(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += b.toString(16).padStart(2, '0');
  return s;
}

/** Salt + SHA-256 hash a password. Falls back to a simple hash if the
 *  Web Crypto API is unavailable (e.g. insecure context). */
async function hashPassword(password: string, saltHex: string): Promise<string> {
  const input = `${saltHex}:${password}`;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return toHex(new Uint8Array(digest));
  }
  // Minimal fallback (non-cryptographic) for insecure contexts.
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

function newSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return toHex(crypto.getRandomValues(new Uint8Array(16)));
  }
  return uid('salt');
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

class LocalAuthProvider implements AuthProvider {
  private listeners = new Set<(u: AuthUser | null) => void>();

  private async accounts(): Promise<Record<string, AccountRecord>> {
    return (await storage.get<Record<string, AccountRecord>>(ACCOUNTS_KEY)) ?? {};
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    return storage.get<AuthUser>(SESSION_KEY);
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const clean = email.trim().toLowerCase();
    if (!isValidEmail(clean)) return { ok: false, message: 'Enter a valid email address' };
    if (password.length < 6) return { ok: false, message: 'Password must be at least 6 characters' };

    const accounts = await this.accounts();
    if (accounts[clean]) return { ok: false, message: 'An account with this email already exists' };

    const saltHex = newSalt();
    const hashHex = await hashPassword(password, saltHex);
    const record: AccountRecord = {
      id: uid('user'),
      email: clean,
      name: clean.split('@')[0] || 'Investor',
      saltHex,
      hashHex,
      createdAt: Date.now(),
    };
    accounts[clean] = record;
    await storage.set(ACCOUNTS_KEY, accounts);

    const user = this.toUser(record);
    await storage.set(SESSION_KEY, user);
    this.emit(user);
    return { ok: true, message: 'Account created', user };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const clean = email.trim().toLowerCase();
    const accounts = await this.accounts();
    const record = accounts[clean];
    if (!record) return { ok: false, message: 'No account found for this email' };
    const hashHex = await hashPassword(password, record.saltHex);
    if (hashHex !== record.hashHex) return { ok: false, message: 'Incorrect password' };

    const user = this.toUser(record);
    await storage.set(SESSION_KEY, user);
    this.emit(user);
    return { ok: true, message: 'Signed in', user };
  }

  async updateName(name: string): Promise<AuthUser | null> {
    const current = await this.getCurrentUser();
    if (!current) return null;
    const trimmed = name.trim();
    if (!trimmed) return current;

    const accounts = await this.accounts();
    const record = accounts[current.email];
    if (record) {
      record.name = trimmed;
      accounts[current.email] = record;
      await storage.set(ACCOUNTS_KEY, accounts);
    }
    const updated: AuthUser = { ...current, name: trimmed };
    await storage.set(SESSION_KEY, updated);
    this.emit(updated);
    return updated;
  }

  async signOut(): Promise<void> {
    await storage.remove(SESSION_KEY);
    this.emit(null);
  }

  onChange(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private toUser(r: AccountRecord): AuthUser {
    return { id: r.id, email: r.email, name: r.name, isGuest: false };
  }

  private emit(user: AuthUser | null) {
    this.listeners.forEach((l) => l(user));
  }
}

export const auth: AuthProvider = new LocalAuthProvider();
