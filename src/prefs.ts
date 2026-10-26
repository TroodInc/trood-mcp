import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

/**
 * How much Trood helps, per area and per project, and what the person turned
 * down (trood-brain products/trood-platform-ai-and-mcp.md, "Beginners and pros").
 * A senior backend engineer may never have bought a domain; a designer may
 * deploy daily and never have touched a database. So the level is per area.
 *
 * Everything here stays on this machine. The project is keyed by a hash of its
 * git remote (or its folder), so no path or repository name is written anywhere
 * that leaves the computer.
 */

export const AREAS = ['launch', 'secrets', 'domains', 'estate', 'checks', 'watch', 'technology', 'help', 'tutorials'] as const;
export type Area = (typeof AREAS)[number];
export const LEVELS = ['guide', 'hint', 'quiet'] as const;
export type Level = (typeof LEVELS)[number];

/** Until the person or the estate scan sets one: a short suggestion, no lecture. */
export const DEFAULT_LEVEL: Level = 'hint';

export const LEVEL_MEANING: Record<Level, string> = {
  guide: 'explain in plain words, do the steps that can be done, wait at the ones that need the person, offer a tutorial where they hesitate',
  hint: 'one-line suggestions, no explanations, tutorials only when asked',
  quiet: 'facts only; say nothing unless a check fails; never offer tutorials',
};

const root = () => process.env.TROOD_HOME ?? join(homedir(), '.trood');

function readJson<T>(file: string, fallback: T): T {
  try { return JSON.parse(readFileSync(file, 'utf8')) as T; } catch { return fallback; }
}

function writeJson(file: string, data: unknown): void {
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  writeFileSync(file, JSON.stringify(data, null, 2), { mode: 0o600 });
  chmodSync(file, 0o600);
}

/** A stable, opaque key for the project this server was started in. */
export function projectKey(cwd = process.cwd()): string {
  let basis = cwd;
  try {
    basis = execFileSync('git', ['config', '--get', 'remote.origin.url'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).trim() || cwd;
  } catch { /* not a git repository: the folder will do */ }
  return createHash('sha256').update(basis.replace(/\.git$/, '').toLowerCase()).digest('hex').slice(0, 16);
}

export interface ProjectPrefs {
  levels: Partial<Record<Area, Level>>;
  /** Offers the person turned down, as "<area>:<kind>", so they are not repeated. */
  declined: string[];
}

const projectFile = (key = projectKey()) => join(root(), 'projects', `${key}.json`);

export function readProject(key?: string): ProjectPrefs {
  const p = readJson<ProjectPrefs>(projectFile(key), { levels: {}, declined: [] });
  return { levels: p.levels ?? {}, declined: Array.isArray(p.declined) ? p.declined : [] };
}

export function levelOf(area: Area, key?: string): Level {
  return readProject(key).levels[area] ?? DEFAULT_LEVEL;
}

export function setLevel(area: Area, level: Level, key?: string): ProjectPrefs {
  const p = readProject(key);
  p.levels[area] = level;
  writeJson(projectFile(key), p);
  return p;
}

export function decline(area: Area, kind: string, key?: string): ProjectPrefs {
  const p = readProject(key);
  const tag = `${area}:${kind.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40)}`;
  if (!p.declined.includes(tag)) p.declined.push(tag);
  writeJson(projectFile(key), p);
  return p;
}

/** Settings for the whole machine: the analytics answer and the active workspace. */
export interface GlobalPrefs {
  analytics?: 'yes' | 'no';
  analyticsAnsweredAt?: string;
  activeWorkspaceId?: string;
}

const globalFile = () => join(root(), 'config.json');

export function readGlobal(): GlobalPrefs {
  return readJson<GlobalPrefs>(globalFile(), {});
}

export function writeGlobal(patch: Partial<GlobalPrefs>): GlobalPrefs {
  const next = { ...readGlobal(), ...patch };
  writeJson(globalFile(), next);
  return next;
}

export const trood = { root };
