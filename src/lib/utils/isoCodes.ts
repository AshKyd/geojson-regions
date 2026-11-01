/**
 * Natural Earth's three-letter codes that look like ISO 3166-1 alpha-3 but aren't: Northern Cyprus
 * and Somaliland are claimed states with no ISO code of their own.
 */
const NON_ISO_CODES = new Set(['CYN', 'SOL']);

/** Whether a filename code is a real three-letter ISO country code, as opposed to a disputed area's name. */
export const isIsoAlpha3 = (code: string) => /^[A-Z]{3}$/.test(code) && !NON_ISO_CODES.has(code);
