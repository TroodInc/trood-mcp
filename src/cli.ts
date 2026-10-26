#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { identity, engine, TroodError } from './http.js';
import { clearSession, readSession, writeSession } from './session.js';
import { config } from './config.js';
import { writeGlobal } from './prefs.js';
import { consent, envBlocks } from './telemetry.js';
import { CONSENT_QUESTION } from './trood-tools.js';

const HELP = `trood-mcp: Trood's MCP server.

  trood-mcp            run the server over stdio (what Claude Desktop and Claude Code start)
  trood-mcp login      sign in with your Trood email and password; the session is saved for about a day
  trood-mcp status     check that you are signed in
  trood-mcp logout     sign out and delete the saved session
  trood-mcp analytics yes|no|status
                       whether Trood may record which Trood tools you use and whether
                       they worked (never your code, files or what you type)
`;

function prompter() {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  let muted = false;
  const write = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput.bind(rl);
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => { if (!muted) write(s); };
  // Lines can arrive before they are asked for (piped input), so they queue.
  const lines: string[] = [];
  const waiting: { resolve: (s: string) => void; reject: (e: Error) => void }[] = [];
  let closed = false;
  const ended = () => new TroodError('Login needs your email and password: input ended early.');
  rl.on('line', (line) => { const w = waiting.shift(); if (w) w.resolve(line); else lines.push(line); });
  rl.on('close', () => { closed = true; while (waiting.length) waiting.shift()!.reject(ended()); });
  const ask = (question: string, hidden = false) => new Promise<string>((resolve, reject) => {
    process.stdout.write(question);
    muted = hidden && !!process.stdin.isTTY;
    const done = (s: string) => { muted = false; if (hidden) process.stdout.write('\n'); resolve(s.trim()); };
    if (lines.length) return done(lines.shift()!);
    if (closed) return reject(ended());
    waiting.push({ resolve: done, reject });
  });
  return { ask, close: () => rl.close() };
}

async function login(): Promise<void> {
  const p = prompter();
  let email: string, password: string;
  try {
    email = await p.ask('Trood email: ');
    password = await p.ask('Password (not shown): ', true);
  } finally {
    p.close();
  }
  if (!email || !password) throw new TroodError('Email and password are both needed.');
  const res = (await identity('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })) as { sessionToken?: string };
  if (!res?.sessionToken) throw new TroodError('Signed in, but Trood returned no session. Try again.');
  writeSession({ token: res.sessionToken, email, savedAt: new Date().toISOString() });
  const me = (await engine('/users/me').catch(() => null)) as { name?: string; roles?: string[] } | null;
  console.log(`Signed in as ${me?.name ?? email}${me?.roles?.length ? ` (${me.roles.join(', ')})` : ''}. Session saved to ${config.sessionFile}.`);
  await askConsentOnce();
}

/** The analytics question, once, and only to a person at a terminal. */
async function askConsentOnce(): Promise<void> {
  if (consent() !== 'unset' || !process.stdin.isTTY) return;
  const p = prompter();
  let answer = '';
  try { answer = (await p.ask(`${CONSENT_QUESTION} [y/n] `)).toLowerCase(); } catch { return; } finally { p.close(); }
  const yes = answer === 'y' || answer === 'yes';
  writeGlobal({ analytics: yes ? 'yes' : 'no', analyticsAnsweredAt: new Date().toISOString() });
  console.log(yes ? 'Thank you. Change it any time with `trood-mcp analytics no`.' : 'Nothing will be sent. Change it any time with `trood-mcp analytics yes`.');
}

async function analytics(): Promise<void> {
  const arg = (process.argv[3] ?? 'status').toLowerCase();
  if (arg === 'yes' || arg === 'no') writeGlobal({ analytics: arg, analyticsAnsweredAt: new Date().toISOString() });
  else if (arg !== 'status') throw new TroodError('Use `trood-mcp analytics yes`, `no` or `status`.');
  const c = consent();
  console.log(`Usage analytics: ${c}${envBlocks() ? ' (DO_NOT_TRACK or TROOD_TELEMETRY=0 is set, so nothing is sent)' : ''}.`);
}

async function status(): Promise<void> {
  const session = readSession();
  if (!session) { console.log('Not signed in. Run `trood-mcp login`.'); return; }
  const me = (await engine('/users/me')) as { name?: string; roles?: string[] };
  console.log(`Signed in as ${me?.name ?? session.email ?? 'unknown'}${me?.roles?.length ? ` (${me.roles.join(', ')})` : ''}.`);
}

async function logout(): Promise<void> {
  const session = readSession();
  if (session && session.savedAt !== 'env') {
    await identity('/auth/logout', { method: 'POST', auth: true }).catch(() => undefined);
  }
  clearSession();
  console.log('Signed out.');
}

async function serve(): Promise<void> {
  const server = createServer();
  await server.connect(new StdioServerTransport());
}

const cmd = process.argv[2];
const commands: Record<string, () => Promise<void>> = { login, status, logout, serve, analytics };

if (cmd === '--help' || cmd === '-h' || cmd === 'help') {
  process.stdout.write(HELP);
} else {
  (commands[cmd ?? 'serve'] ?? (async () => { process.stdout.write(HELP); process.exitCode = 1; }))()
    .catch((err) => {
      console.error(err instanceof TroodError ? err.message : err);
      process.exitCode = 1;
    });
}
