/**
 * The provider's own research, on their own machine: one file per company, readable
 * by them only. Nobody else, Trood included, sees which provider researched which
 * company or what they inferred (trood-brain products/trood-platform-ai-and-mcp.md).
 */
import { chmodSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.js';
import type { Detected } from './detect.js';

export interface Fact {
  id: string;
  statement: string;
  sourceUrl: string;
  kind: 'fact' | 'technology';
  state: 'fact' | 'inference';
  observedAt: string;
  expiresAt: string;
}

export interface Company {
  domain: string;
  website: string;
  name: string | null;
  industry: string;
  researchedAt: string;
  pages: { url: string; status: number; title: string | null; chars: number }[];
  technologies: Detected[];
  facts: Fact[];
  offer?: {
    headline: string;
    heard: string;
    factIds: string[];
    options: { id: string; amount: number | null }[];
    preparedBy: string | null;
    draftedAt: string;
    brief: string;
  };
  /**
   * Where the offer went. Before 2026-10-16 an operator's offer was an Engine
   * project with a proposal link; since then every offer goes to the platform:
   * a link straight away for Trood's operators, or Trood's review for a partner.
   */
  published?:
    | { projectId: string; proposalUrl: string; publishedAt: string }
    | { link: string; token: string; publishedAt: string }
    | { review: true; submittedAt: string };
}

const dir = () => config.companiesDir;

export function domainOf(website: string): string {
  const u = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
  return u.hostname.toLowerCase().replace(/^www\./, '');
}

export function saveCompany(c: Company): void {
  mkdirSync(dir(), { recursive: true, mode: 0o700 });
  const file = join(dir(), `${c.domain}.json`);
  writeFileSync(file, JSON.stringify(c, null, 2), { mode: 0o600 });
  chmodSync(file, 0o600);
}

export function loadCompany(domainOrUrl: string): Company | null {
  try {
    return JSON.parse(readFileSync(join(dir(), `${domainOf(domainOrUrl)}.json`), 'utf8')) as Company;
  } catch {
    return null;
  }
}

export function listCompanies(): Company[] {
  try {
    return readdirSync(dir()).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir(), f), 'utf8')) as Company);
  } catch {
    return [];
  }
}
