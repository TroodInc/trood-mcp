/**
 * Contact details never leave Trood through the MCP: the model on the other side
 * belongs to whoever connected it. Same rule as the platform's "contact details
 * stay hidden" (ADR-015).
 */
const DROP = new Set([
  'email', 'phone', 'contactEmail', 'contactPhone', 'requestContact', 'requestContactJson',
  'internalNotes', 'stripeCheckoutUrl', 'stripeCheckoutSessionId', 'kratosIdentityId',
]);

export function redact(value: unknown): unknown {
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
