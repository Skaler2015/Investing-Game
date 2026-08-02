/**
 * Low-level client for the PHP + MySQL backend that lives under `/api/*.php`
 * on the same origin. Every call is a small JSON POST/GET; auth is carried in
 * the `X-Token` header (issued by signup/login, kept in localStorage).
 *
 * Nothing here is game-aware — it is a thin transport used by `persistence`
 * (services/backend.ts), which decides when the server is available and falls
 * back to on-device storage when it isn't.
 */

const BASE = '/api';
const TOKEN_KEY = 'invest-master:api-token';

export interface ApiUser {
  id: string;
  email: string;
  name: string;
}

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

interface ReqOpts {
  method?: 'GET' | 'POST';
  body?: unknown;
  /** milliseconds before the request is aborted */
  timeout?: number;
}

/**
 * Make a request to `/api/<path>`. Resolves with the parsed JSON. Rejects with
 * an Error whose `.message` is the server-provided message when possible.
 */
export async function apiFetch<T = unknown>(path: string, opts: ReqOpts = {}): Promise<T> {
  const { method = 'GET', body, timeout = 12000 } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers['X-Token'] = token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${BASE}/${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    throw new Error('network');
  }
  clearTimeout(timer);

  // Content-type check guards against the SPA .htaccess returning index.html
  // (200 text/html) for a missing endpoint — that must not parse as success.
  const ctype = res.headers.get('content-type') ?? '';
  if (!ctype.includes('application/json')) {
    throw new Error('unavailable');
  }

  let data: Record<string, unknown> | null = null;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new Error('bad-response');
  }

  if (!res.ok || (data && data.ok === false)) {
    throw new Error((data && (data.error as string)) || `http ${res.status}`);
  }
  return data as T;
}
