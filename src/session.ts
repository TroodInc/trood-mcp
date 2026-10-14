import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { config } from './config.js';

export interface Session {
  token: string;
  email?: string;
  savedAt: string;
}

/**
 * The person's Trood session token (a Kratos session, the same one Product Engine
 * accepts as a bearer). TROOD_SESSION_TOKEN wins over the file. The file is
 * readable by its owner only and is never logged.
 */
export function readSession(): Session | null {
  const fromEnv = process.env.TROOD_SESSION_TOKEN;
  if (fromEnv) return { token: fromEnv, savedAt: 'env' };
  try {
    const parsed = JSON.parse(readFileSync(config.sessionFile, 'utf8')) as Session;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  mkdirSync(dirname(config.sessionFile), { recursive: true, mode: 0o700 });
  writeFileSync(config.sessionFile, JSON.stringify(session), { mode: 0o600 });
  chmodSync(config.sessionFile, 0o600);
}

export function clearSession(): void {
  rmSync(config.sessionFile, { force: true });
}
