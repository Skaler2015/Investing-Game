/**
 * Authentication abstraction.
 *
 * The app talks to auth exclusively through the `AuthProvider` interface, so
 * the local guest implementation below can be replaced with a real identity
 * provider (Firebase Auth, Supabase Auth, Auth0, a custom JWT backend, …)
 * without touching UI or game logic.
 *
 * The default `LocalAuthProvider` creates an anonymous on-device "guest"
 * account. It performs NO real credential handling — appropriate for an
 * offline single-player simulation — while modelling the shape a real,
 * secure provider would expose (session token, sign-in/out, listener).
 */
import { storage } from './storage';
import { uid } from '../utils/id';

export interface AuthUser {
  id: string;
  name: string;
  /** Opaque session token — a real provider returns a signed JWT here. */
  token: string;
  isGuest: boolean;
}

export interface AuthProvider {
  getCurrentUser(): Promise<AuthUser | null>;
  signInAsGuest(name?: string): Promise<AuthUser>;
  updateName(name: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onChange(cb: (user: AuthUser | null) => void): () => void;
}

const AUTH_KEY = 'auth-user';

class LocalAuthProvider implements AuthProvider {
  private listeners = new Set<(u: AuthUser | null) => void>();

  async getCurrentUser(): Promise<AuthUser | null> {
    return storage.get<AuthUser>(AUTH_KEY);
  }

  async signInAsGuest(name?: string): Promise<AuthUser> {
    const existing = await this.getCurrentUser();
    if (existing) return existing;
    const user: AuthUser = {
      id: uid('user'),
      name: name?.trim() || 'Guest Investor',
      token: uid('tok'),
      isGuest: true,
    };
    await storage.set(AUTH_KEY, user);
    this.emit(user);
    return user;
  }

  async updateName(name: string): Promise<AuthUser> {
    const current = (await this.getCurrentUser()) ?? (await this.signInAsGuest(name));
    const updated: AuthUser = { ...current, name: name.trim() || current.name };
    await storage.set(AUTH_KEY, updated);
    this.emit(updated);
    return updated;
  }

  async signOut(): Promise<void> {
    await storage.remove(AUTH_KEY);
    this.emit(null);
  }

  onChange(cb: (user: AuthUser | null) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(user: AuthUser | null) {
    this.listeners.forEach((l) => l(user));
  }
}

export const auth: AuthProvider = new LocalAuthProvider();
