/**
 * Trood's catalog: the platform's industry packs (a generated copy of the API's
 * api/src/catalog/packs.ts; npm run check fails if they differ). Prices are
 * placeholders by design: the provider sets each amount, and Trood prices a
 * published offer from its own rate card.
 */
import { PACKS, detectPack, packById, packOfOption, type Option } from './packs.generated.js';

export { detectPack, packById, packOfOption };

export interface CatalogOption {
  id: string;
  title: string;
  description: string;
  answers: string[];
  uses: string[];
  effortBand: 'XS' | 'S' | 'M' | 'L' | 'XL';
  priceRange: string;
}

const toCatalog = (o: Option): CatalogOption => ({
  id: o.id,
  title: o.title,
  description: o.description,
  answers: o.answers ?? [],
  uses: o.uses,
  effortBand: o.size,
  priceRange: '[$ from-to]',
});

export const INDUSTRY_IDS = PACKS.map((p) => p.id) as [string, ...string[]];

export const CATALOG: Record<string, CatalogOption[]> = Object.fromEntries(PACKS.map((p) => [p.id, p.options.map(toCatalog)]));

/** Every pack, with its options' ids, titles and sizes: what to pass get_catalog. */
export function industriesIndex() {
  return PACKS.map((p) => ({ industry: p.id, label: p.label, options: p.options.map((o) => ({ id: o.id, title: o.title, effortBand: o.size })) }));
}

export function findOption(id: string): CatalogOption | undefined {
  const o = packOfOption(id)?.options.find((x) => x.id === id);
  return o ? toCatalog(o) : undefined;
}

/** Deterministic suggestions from what the site shows, the self-serve page's rules. */
export function matchOptions(industry: string, slots: Set<string>, names: Set<string>): { option: CatalogOption; why: string }[] {
  const out: { option: CatalogOption; why: string }[] = [];
  const add = (id: string, why: string) => { const o = findOption(id); if (o && !out.some((x) => x.option.id === id)) out.push({ option: o, why }); };
  if (industry === 'hotels') {
    if (slots.has('Guest messaging')) add('inq', `Guests can write on ${[...names].filter((n) => ['WhatsApp', 'Instagram', 'Facebook', 'Telegram'].includes(n)).join(', ')}`);
    const channels = [...names].filter((n) => ['Booking.com', 'Agoda', 'Expedia', 'Airbnb'].includes(n));
    if (channels.length >= 1 && slots.has('Booking engine')) add('list', `Bookings arrive from the website and ${channels.join(', ')}`);
    if (slots.has('Booking engine')) add('pre', 'A booking engine is in place to send pre-arrival forms from');
    if (names.has('Tripadvisor') || channels.length) add('rev', `Reviews collect on ${[...(names.has('Tripadvisor') ? ['Tripadvisor'] : []), ...channels].join(', ')}`);
    return out;
  }
  // Any other pack: an option is suggested when the site shows a tool from the slots it relies on.
  const pack = packById(industry);
  for (const o of pack?.options ?? []) {
    const seen = pack!.slots.filter((s) => o.relies.includes(s.id)).flatMap((s) => s.choices.filter((c) => names.has(c)));
    if (seen.length) add(o.id, `The site shows ${[...new Set(seen)].join(', ')}`);
  }
  return out;
}
