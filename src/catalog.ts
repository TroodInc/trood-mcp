/**
 * Trood's catalog, until the platform's own store holds providers' catalogs.
 * Templates so far: hotels and retreats. Prices are placeholders by design:
 * the provider sets each amount before an offer is published.
 */
export interface CatalogOption {
  id: string;
  title: string;
  description: string;
  answers: string[];
  uses: string[];
  effortBand: 'XS' | 'S' | 'M' | 'L' | 'XL';
  priceRange: string;
}

export const CATALOG: Record<string, CatalogOption[]> = {
  hotels: [
    { id: 'inq', title: 'Inquiries answered with your prices and dates', description: 'Common questions on WhatsApp and Instagram answered straight away. Anything that needs a person goes to the front desk with the conversation attached.', answers: ['Guests wait too long for replies', 'Same questions answered all day'], uses: ['Guest messaging', 'Booking engine'], effortBand: 'M', priceRange: '[$ from-to]' },
    { id: 'pre', title: 'Pre-arrival details collected ahead', description: 'A short form before arrival. Answers become tasks for the right person.', answers: ['Pre-arrival details chased by message'], uses: ['Guest messaging', 'Booking engine'], effortBand: 'S', priceRange: '[$ from-to]' },
    { id: 'list', title: 'One list of bookings from every channel', description: "Website, Booking.com and Agoda bookings in one list, tomorrow's arrivals first.", answers: ['Bookings scattered across channels'], uses: ['Booking engine', 'Sales channels'], effortBand: 'M', priceRange: '[$ from-to]' },
    { id: 'rev', title: 'Reviews answered in your voice', description: 'Google, Tripadvisor and Booking.com reviews get a reply drafted for you to approve.', answers: ['Reviews left without an answer'], uses: ['Reviews', 'Sales channels'], effortBand: 'S', priceRange: '[$ from-to]' },
  ],
};

export function findOption(id: string): CatalogOption | undefined {
  return Object.values(CATALOG).flat().find((o) => o.id === id);
}

/** Deterministic suggestions from what the site shows, the self-serve page's rules. */
export function matchOptions(slots: Set<string>, names: Set<string>): { option: CatalogOption; why: string }[] {
  const out: { option: CatalogOption; why: string }[] = [];
  const add = (id: string, why: string) => { const o = findOption(id); if (o && !out.some((x) => x.option.id === id)) out.push({ option: o, why }); };
  if (slots.has('Guest messaging')) add('inq', `Guests can write on ${[...names].filter((n) => ['WhatsApp', 'Instagram', 'Facebook', 'Telegram'].includes(n)).join(', ')}`);
  const channels = [...names].filter((n) => ['Booking.com', 'Agoda', 'Expedia', 'Airbnb'].includes(n));
  if (channels.length >= 1 && slots.has('Booking engine')) add('list', `Bookings arrive from the website and ${channels.join(', ')}`);
  if (slots.has('Booking engine')) add('pre', 'A booking engine is in place to send pre-arrival forms from');
  if (names.has('Tripadvisor') || channels.length) add('rev', `Reviews collect on ${[...(names.has('Tripadvisor') ? ['Tripadvisor'] : []), ...channels].join(', ')}`);
  return out;
}
