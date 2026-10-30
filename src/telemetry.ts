import { appendFileSync, chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { config } from './config.js';
import { readGlobal, trood } from './prefs.js';
import { readSession } from './session.js';

/**
 * Usage analytics, only after the person said yes (trood-brain
 * products/trood-platform-ai-and-mcp.md, "Usage analytics, by explicit consent").
 *
 * What is sent is built here from fixed fields, never from tool arguments:
 * which tool or prompt, its area and help level, whether it worked, how long it
 * took, the MCP client and its version, the OS family and this server's version.
 * Never arguments, file paths, repository or company names, code or contents.
 *
 * DO_NOT_TRACK=1 or TROOD_TELEMETRY=0 always wins over a yes. Every event sent
 * is also written to a local log the person can read (show_my_trood_data).
 */

export const MCP_VERSION = '0.4.0';
const LOG_KEEP = 200;

export type Consent = 'yes' | 'no' | 'unset';

export function envBlocks(): boolean {
  const dnt = process.env.DO_NOT_TRACK;
  const tt = process.env.TROOD_TELEMETRY;
  return (dnt !== undefined && dnt !== '' && dnt !== '0') || tt === '0' || tt === 'false';
}

export function consent(): Consent {
  if (envBlocks()) return 'no';
  return readGlobal().analytics ?? 'unset';
}

export type McpEvent = 'mcp_tool' | 'mcp_prompt' | 'mcp_level' | 'mcp_declined';

export interface EventFields {
  tool?: string;
  prompt?: string;
  area?: string;
  level?: string;
  outcome?: 'ok' | 'error';
  ms?: number;
  client?: string;
  cv?: string;
}

const NAME = /^[a-z][a-z0-9_-]{0,39}$/i;

/** Only the fixed fields, each checked; anything else is dropped. */
export function cleanFields(f: EventFields): Record<string, string | number> {
  const out: Record<string, string | number> = { os: process.platform, v: MCP_VERSION };
  for (const k of ['tool', 'prompt', 'area', 'level', 'outcome'] as const) {
    const val = f[k];
    if (typeof val === 'string' && NAME.test(val)) out[k] = val;
  }
  if (typeof f.ms === 'number' && Number.isFinite(f.ms)) out.ms = Math.max(0, Math.round(f.ms));
  if (typeof f.client === 'string') out.client = f.client.replace(/[^\w .-]/g, '').slice(0, 40);
  if (typeof f.cv === 'string') out.cv = f.cv.replace(/[^\w.+-]/g, '').slice(0, 20);
  return out;
}

const logFile = () => join(trood.root(), 'telemetry.jsonl');

export function readLog(): unknown[] {
  try {
    return readFileSync(logFile(), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

function appendLog(entry: unknown): void {
  const file = logFile();
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  appendFileSync(file, JSON.stringify(entry) + '\n', { mode: 0o600 });
  chmodSync(file, 0o600);
  const lines = readLog();
  if (lines.length > LOG_KEEP) writeFileSync(file, lines.slice(-LOG_KEEP).map((l) => JSON.stringify(l)).join('\n') + '\n', { mode: 0o600 });
}

/**
 * Sends one event if, and only if, the person said yes. Fire and forget: a
 * failure to send never affects the tool that triggered it.
 */
export function track(event: McpEvent, fields: EventFields): void {
  if (consent() !== 'yes') return;
  const properties = cleanFields(fields);
  const session = readSession();
  const signedIn = Boolean(session);
  try { appendLog({ at: new Date().toISOString(), event, signedIn, properties }); } catch { /* the log is a courtesy */ }

  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'User-Agent': `trood-mcp/${MCP_VERSION}` };
  const req = signedIn
    ? fetch(`${config.identityUrl}/users/me/events`, {
        method: 'POST',
        headers: { ...headers, Authorization: `Bearer ${session!.token}` },
        body: JSON.stringify({ event, properties }),
        signal: AbortSignal.timeout(5000),
      })
    : fetch(`${config.identityUrl}/public/e`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ p: 'mcp', e: event, props: properties }),
        signal: AbortSignal.timeout(5000),
      });
  req.catch(() => undefined);
}
