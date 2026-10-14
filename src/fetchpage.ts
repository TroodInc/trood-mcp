/**
 * Fetching a company's website, safely.
 *
 * Ported from Growth's page probe (trood-growth-back src/reads/page-probe.ts):
 * redirects followed by hand with every hop checked against private addresses,
 * a size cap and one deadline. The MCP runs on the provider's own machine, so the
 * private-address rule protects their home network rather than Trood's.
 */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export interface FetchedPage {
  url: string;
  status: number;
  html: string;
  title: string | null;
  description: string | null;
  text: string;
}

const TIMEOUT_MS = 12_000;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const UA = 'TroodMCP/0.2 (+https://trood.com; reads a company website for a provider preparing an offer)';

export class FetchRefused extends Error {}

export async function fetchPage(rawUrl: string): Promise<FetchedPage> {
  let url: URL;
  try { url = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`); }
  catch { throw new FetchRefused('Not a valid web address.'); }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const refusal = await refuseReason(url);
      if (refusal) throw new FetchRefused(refusal);
      response = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'Accept-Language': 'en' },
      });
      const location = response.headers.get('location');
      if (response.status >= 300 && response.status < 400 && location) {
        url = new URL(location, url);
        await response.body?.cancel();
        continue;
      }
      break;
    }
    if (!response || (response.status >= 300 && response.status < 400)) throw new FetchRefused('Too many redirects.');
    const html = /html/i.test(response.headers.get('content-type') ?? '') ? await readCapped(response) : '';
    if (!html) await response.body?.cancel().catch(() => undefined);
    return {
      url: url.href,
      status: response.status,
      html,
      title: decode(match(html, /<title[^>]*>([\s\S]*?)<\/title>/i)),
      description: decode(
        match(html, /<meta[^>]+(?:name|property)=["'](?:og:)?description["'][^>]*content=["']([^"']*)["']/i) ??
          match(html, /<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["'](?:og:)?description["']/i),
      ),
      text: visibleText(html),
    };
  } catch (e) {
    if (e instanceof FetchRefused) throw e;
    const err = e as Error & { cause?: { code?: string } };
    throw new FetchRefused(err.name === 'AbortError' ? `No response within ${TIMEOUT_MS / 1000}s.` : err.cause?.code ?? err.message);
  } finally {
    clearTimeout(timer);
  }
}

/** Same-site links worth a second look: about, contact, rooms, booking, spa, events. At most `max`. */
export function interestingLinks(page: FetchedPage, max = 3): string[] {
  const base = new URL(page.url);
  const seen = new Set<string>([base.href.replace(/#.*$/, '')]);
  const out: string[] = [];
  for (const m of page.html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    let u: URL;
    try { u = new URL(m[1], base); } catch { continue; }
    if (u.hostname.replace(/^www\./, '') !== base.hostname.replace(/^www\./, '')) continue;
    if (!/^https?:$/.test(u.protocol)) continue;
    const key = u.href.replace(/#.*$/, '');
    if (seen.has(key)) continue;
    const label = `${u.pathname} ${m[2].replace(/<[^>]+>/g, ' ')}`.toLowerCase();
    if (!/about|contact|room|villa|suite|book|reserv|stay|spa|event|wedding|meeting|faq|service|price/.test(label)) continue;
    seen.add(key);
    out.push(key);
    if (out.length >= max) break;
  }
  return out;
}

async function refuseReason(url: URL): Promise<string | null> {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'Only http and https links.';
  if (process.env.TROOD_ALLOW_PRIVATE_FETCH === '1') return null; // tests only
  if (url.port && url.port !== '80' && url.port !== '443') return 'Non-standard port.';
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return 'Internal hostname.';
  let addresses: string[];
  try {
    addresses = isIP(host) ? [host] : (await lookup(host, { all: true, verbatim: true })).map((a) => a.address);
  } catch {
    return null; // the fetch reports the DNS failure itself
  }
  return addresses.some(isPrivateAddress) ? 'Resolves to a private address.' : null;
}

function isPrivateAddress(address: string): boolean {
  const v4 = address.startsWith('::ffff:') ? address.slice(7) : address;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224;
  }
  const v6 = address.toLowerCase();
  return v6 === '::' || v6 === '::1' || v6.startsWith('fc') || v6.startsWith('fd') || v6.startsWith('fe80');
}

async function readCapped(response: Response): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  await reader.cancel().catch(() => undefined);
  return Buffer.concat(chunks).toString('utf8');
}

function visibleText(html: string): string {
  const body = match(html, /<body[^>]*>([\s\S]*)<\/body>/i) ?? html;
  return decode(
    body.replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' '),
  )?.replace(/\s+/g, ' ').trim() ?? '';
}

function match(text: string, pattern: RegExp): string | null {
  const m = text.match(pattern);
  return m ? m[1] : null;
}

function decode(text: string | null): string | null {
  if (text == null) return null;
  const out = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").trim();
  return out || null;
}
