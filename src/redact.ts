/**
 * Contact details never leave Trood through the MCP: the model on the other side
 * belongs to whoever connected it. Same rule as the platform's "contact details
 * stay hidden" (ADR-015).
 */
const DROP = new Set([
  'email', 'phone', 'contactEmail', 'contactPhone', 'requestContact', 'requestContactJson',
  'internalNotes', 'stripeCheckoutUrl', 'stripeCheckoutSessionId', 'kratosIdentityId',
]);

/**
 * Some contact details sit in other fields: Engine uses the email as a person's
 * name when they gave none, and people write them into a project's description.
 */
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const PHONE = /\+\d[\d\s().-]{6,}\d/g;

export function redact(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(EMAIL, '[email hidden]').replace(PHONE, '[phone hidden]');
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (DROP.has(k)) continue;
      out[k] = redact(v);
    }
    return out;
  }
  return value;
}
