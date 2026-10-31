export type Properties = Record<string, string | number | null>;

/** Lowercase name with everything but letters, digits and underscores removed, e.g. "Europa Island" -> "europaisland". */
const slugify = (value: unknown) => String(value ?? "").toLowerCase().replace(/\W/g, "");

/**
 * Picks a stable filename stem for a country.
 * Disputed areas and the like have no ISO code (-99), so we fall back to the
 * Geounit code for countries, or a slug of the name for everything else.
 * Features with no name either (some point-of-view files have a few) use their `adm0_a3_*` code.
 */
export const countryCode = ({ iso_a3, gu_a3, type, name, ...rest }: Properties) => {
  if (iso_a3 && Number(iso_a3) !== -99) return String(iso_a3);
  if (["Country", "Sovereign country"].includes(String(type))) {
    return String(gu_a3);
  }
  const slug = slugify(name);
  if (slug) return slug;
  const adm0Key = Object.keys(rest).find((key) => key.startsWith("adm0_a3_") && rest[key]);
  return adm0Key ? slugify(rest[adm0Key]) : "unnamed";
};

/**
 * Gives every feature in a file its own filename stem.
 * A code used once stays exactly as `countryCode` made it, so existing filenames don't change.
 * Where several features share a code (e.g. Saba, Bonaire and Sint Eustatius are all `BES`) they
 * all get `<code>-<name slug>`, so none of them depends on file order to keep the bare code.
 * Features with no usable name are numbered instead.
 */
export const assignCodes = (propertiesList: Properties[]) => {
  const baseCodes = propertiesList.map(countryCode);
  const uses = baseCodes.reduce(
    (counts, code) => counts.set(code, (counts.get(code) ?? 0) + 1),
    new Map<string, number>(),
  );
  const taken = new Set<string>();
  return propertiesList.map((properties, position) => {
    const base = baseCodes[position]!;
    if (uses.get(base) === 1) {
      taken.add(base);
      return base;
    }
    const slug = slugify(properties.name);
    const preferred = slug ? `${base}-${slug}` : `${base}-${position + 1}`;
    // Last resort: two features with the same code *and* name.
    const code = Array.from({ length: taken.size + 2 }, (_, attempt) =>
      attempt === 0 ? preferred : `${preferred}-${attempt + 1}`,
    ).find((candidate) => !taken.has(candidate))!;
    taken.add(code);
    return code;
  });
};
