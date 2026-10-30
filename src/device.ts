import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import { trood } from './prefs.js';
import { writeSession } from './session.js';
import { MCP_VERSION } from './telemetry.js';

/**
 * Browser sign-in (trood-brain ADR-018): Trood shows a link and a short code,
 * the person approves on platform.trood.com/cli, and this computer receives a
 * Trood token that lasts 90 days and can be disconnected from the platform.
 * The terminal (`trood-mcp login`) and the agent (`trood_sign_in`) share it.
 */

export interface Started {
  userCode: string;
  link: string;
  expiresAt: number;
  interval: number;
}

export type Poll = { state: 'approved' } | { state: 'pending' } | { state: 'failed'; reason: string };

const pendingFile = () => join(trood.root(), 'pending-signin.json');
const UA = { 'User-Agent': `trood-mcp/${MCP_VERSION}`, 'Content-Type': 'application/json' };

/** "Trood MCP on <this computer>", so the person recognises it on the approval page and in Connected tools. */
export function deviceLabel(): string {
  const name = hostname().replace(/\.local$/, '').replace(/[^\w .-]/g, '').slice(0, 40);
  return name ? `Trood MCP on ${name}` : 'Trood MCP';
}

export async function startSignIn(): Promise<Started> {
  const res = await fetch(`${config.identityUrl}/public/device/start`, {
    method: 'POST',
    headers: UA,
    body: JSON.stringify({ client: 'trood-mcp', label: deviceLabel() }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!res.ok) throw new Error(res.status === 429 ? 'Too many sign-ins started from here. Try again in an hour.' : `Trood could not start a sign-in (HTTP ${res.status}).`);
  const d = (await res.json()) as { device_code: string; user_code: string; verification_uri_complete: string; expires_in: number; interval: number };
  const started: Started = { userCode: d.user_code, link: d.verification_uri_complete, expiresAt: Date.now() + d.expires_in * 1000, interval: d.interval };
  // The device code is a secret: owner-only, deleted when the sign-in ends.
  const file = pendingFile();
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  writeFileSync(file, JSON.stringify({ deviceCode: d.device_code, ...started }), { mode: 0o600 });
  chmodSync(file, 0o600);
  return started;
}

export function pendingSignIn(): (Started & { deviceCode: string }) | null {
  try {
    const p = JSON.parse(readFileSync(pendingFile(), 'utf8'));
    return p?.deviceCode && p.expiresAt > Date.now() ? p : null;
  } catch {
    return null;
  }
}

/** One poll. On approval the token is saved like a session and the pending file removed. */
export async function pollOnce(): Promise<Poll> {
  const p = pendingSignIn();
  if (!p) return { state: 'failed', reason: 'No sign-in is waiting, or it expired. Start it again.' };
  const res = await fetch(`${config.identityUrl}/public/device/token`, {
    method: 'POST',
    headers: UA,
    body: JSON.stringify({ device_code: p.deviceCode }),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };
  if (res.ok && body.access_token) {
    writeSession({ token: body.access_token, savedAt: new Date().toISOString() });
    rmSync(pendingFile(), { force: true });
    return { state: 'approved' };
  }
  if (body.error === 'authorization_pending' || body.error === 'slow_down') return { state: 'pending' };
  rmSync(pendingFile(), { force: true });
  const reasons: Record<string, string> = {
    access_denied: 'The sign-in was denied on platform.trood.com.',
    expired_token: 'The code expired. Start the sign-in again.',
  };
  return { state: 'failed', reason: reasons[body.error ?? ''] ?? 'The sign-in did not work. Start it again.' };
}

/** Polls until approved, denied or expired, or until `maxMs` passes. */
export async function waitForApproval(maxMs: number): Promise<Poll> {
  const deadline = Date.now() + maxMs;
  for (;;) {
    const p = pendingSignIn();
    if (!p) return { state: 'failed', reason: 'The sign-in expired. Start it again.' };
    await new Promise((r) => setTimeout(r, p.interval * 1000));
    const result = await pollOnce();
    if (result.state !== 'pending' || Date.now() > deadline) return result;
  }
}

/** Signs this computer out: a Trood token is revoked on the server, not just forgotten. */
export async function revokeToken(token: string): Promise<void> {
  if (!token.startsWith('trd_')) return;
  await fetch(`${config.identityUrl}/me/tokens/current`, {
    method: 'DELETE',
    headers: { ...UA, Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(config.timeoutMs),
  }).catch(() => undefined);
}
