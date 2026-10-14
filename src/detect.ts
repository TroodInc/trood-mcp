/**
 * Tier 0 of the analysis (trood-brain products/trood-platform-ai-and-mcp.md): what a
 * company runs on, read from its pages' HTML. No model, no cost. Each hit names
 * the page it was seen on, so it can become a fact with a source.
 */
export interface Detected {
  name: string;
  slot: string;
  url: string;
  evidence: string;
}

const SIGNATURES: [string, string, RegExp][] = [
  ['Cloudbeds', 'Booking engine', /cloudbeds\.com|hotels\.cloudbeds/i],
  ['SiteMinder', 'Booking engine', /siteminder|thebookingbutton|direct-book\.com/i],
  ['Little Hotelier', 'Booking engine', /littlehotelier/i],
  ['Mews', 'Booking engine', /mews\.(com|li)\/distributor|app\.mews\.com/i],
  ['SynXis', 'Booking engine', /synxis\.com/i],
  ['Beds24', 'Booking engine', /beds24\.com/i],
  ['Lodgify', 'Booking engine', /lodgify\.com/i],
  ['Smoobu', 'Booking engine', /smoobu\.com/i],
  ['Hostaway', 'Booking engine', /hostaway/i],
  ['Booking.com', 'Sales channels', /booking\.com\/hotel|booking\.com"|bstatic\.com/i],
  ['Agoda', 'Sales channels', /agoda\.com/i],
  ['Expedia', 'Sales channels', /expedia\.[a-z.]+\//i],
  ['Airbnb', 'Sales channels', /airbnb\.[a-z.]+\/rooms/i],
  ['Tripadvisor', 'Reviews', /tripadvisor\./i],
  ['WhatsApp', 'Guest messaging', /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//i],
  ['Instagram', 'Guest messaging', /instagram\.com\/[a-z0-9_.]+/i],
  ['Facebook', 'Guest messaging', /facebook\.com\/[a-z0-9_.-]+/i],
  ['Telegram', 'Guest messaging', /t\.me\/[a-z0-9_]+/i],
  ['Tidio', 'Website chat', /tidio/i],
  ['Intercom', 'Website chat', /widget\.intercom\.io|intercomcdn/i],
  ['Crisp', 'Website chat', /client\.crisp\.chat/i],
  ['Tawk.to', 'Website chat', /embed\.tawk\.to/i],
  ['WordPress', 'Website system', /wp-content|wp-includes/i],
  ['Wix', 'Website system', /wixstatic\.com|wix\.com/i],
  ['Squarespace', 'Website system', /squarespace\.com|static1\.squarespace/i],
  ['Webflow', 'Website system', /webflow\.(com|io)|assets\.website-files\.com/i],
  ['Shopify', 'Website system', /cdn\.shopify\.com/i],
  ['Tilda', 'Website system', /tildacdn|tilda\.ws/i],
  ['Framer', 'Website system', /framerusercontent\.com|framer\.website/i],
  ['Stripe', 'Payments', /js\.stripe\.com/i],
  ['PayPal', 'Payments', /paypal\.com\/sdk|paypalobjects/i],
  ['Mailchimp', 'Email marketing', /list-manage\.com|mailchimp/i],
  ['Klaviyo', 'Email marketing', /klaviyo/i],
  ['Google Analytics', 'Analytics', /googletagmanager\.com|google-analytics\.com|gtag\(/i],
  ['Meta Pixel', 'Analytics', /connect\.facebook\.net\/[^"']*fbevents|fbq\(/i],
];

export function detect(pages: { url: string; html: string }[]): Detected[] {
  const out = new Map<string, Detected>();
  for (const page of pages) {
    for (const [name, slot, re] of SIGNATURES) {
      if (out.has(name)) continue;
      const m = page.html.match(re);
      if (m) out.set(name, { name, slot, url: page.url, evidence: m[0].slice(0, 80) });
    }
  }
  return [...out.values()];
}
