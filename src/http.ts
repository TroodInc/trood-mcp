import { config } from './config.js';
import { readSession } from './session.js';

export class TroodError extends Error {
  constructor(message: string, readonly status?: number) { super(message); }
}

const NO_SESSION =
  'You are not signed in to Trood. Run `trood-mcp login` in a terminal, then try again.';
const EXPIRED =
  'Your Trood session has expired or was signed out (sessions last about a day). Run `trood-mcp login` again.';

async function call(base: string, path: string, init: RequestInit & { auth?: boolean } = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  if (init.auth) {
    const session = readSession();
    if (!session) throw new TroodError(NO_SESSION);
    headers.set('Authorization', `Bearer ${session.token}`);
  }
  let res: Response;
  try {
    res = await fetch(base + path, { ...init, headers, signal: AbortSignal.timeout(config.timeoutMs) });
  } catch (err) {
    throw new TroodError(`Could not reach ${new URL(base).host}: ${(err as Error).message}`);
  }
  if (res.status === 401) throw new TroodError(init.auth ? EXPIRED : 'Not authorised.');
  if (res.status === 403) throw new TroodError('Trood says you do not have access to that.', 403);
  if (res.status === 404) throw new TroodError('Not found.');
  if (res.status === 204) return null;
  const text = await res.text();
  let body: unknown = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const msg = (body as { message?: string; error?: { message?: string } })?.error?.message
      ?? (body as { message?: string })?.message ?? `HTTP ${res.status}`;
    throw new TroodError(`Trood refused the request: ${msg}`);
  }
  return body;
}

export const engine = (path: string, init: RequestInit = {}) => call(config.engineUrl, path, { ...init, auth: true });
export const tree = (path: string) => call(config.treeUrl, path);
export const identity = (path: string, init: RequestInit & { auth?: boolean } = {}) => call(config.identityUrl, path, init);
