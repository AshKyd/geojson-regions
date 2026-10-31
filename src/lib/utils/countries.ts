export type Resolution = "110m" | "50m" | "10m";

/** Natural Earth only publishes point-of-view variants at 10m. */
const POV_RESOLUTION: Resolution = "10m";

export interface CountryIndex {
  all: Record<string, { filename: string; countryName: string }>;
  [continent: string]: Record<string, unknown>;
}

/** Folder holding a set of outlines. An empty `pov` means Natural Earth's default (de facto) borders. */
export const outlinesPath = ({
  resolution,
  pov = "",
}: {
  resolution: Resolution;
  pov?: string;
}) =>
  pov
    ? `/countries/pov/${pov}/${POV_RESOLUTION}`
    : `/countries/${resolution}`;

/**
 * The preview map is always the lightest set of outlines, even for a point of view: the 10m
 * outlines are too slow to render. Selections still match, since they're keyed by filename.
 */
export const MAP_OUTLINES_URL = "/countries/110m/all.geojson";

export const fetchJson = <T>(url: string): Promise<T> =>
  fetch(url).then((response) => {
    if (!response.ok) throw new Error(`${url} responded ${response.status}`);
    return response.json();
  });

/** Filenames for every country in a region, e.g. "Asia". "Other" covers Antarctica and the open ocean. */
export const regionFilenames = (index: CountryIndex, regionName: string) => {
  if (regionName === "All") {
    return Object.values(index.all).map(({ filename }) => filename);
  }
  const region =
    regionName === "Other"
      ? { ...index.Antarctica, ...index["Seven seas (open ocean)"] }
      : index[regionName];
  return Object.values(region ?? {}) as string[];
};

/**
 * Looks up the filename a map feature is stored under.
 * Freshly processed data carries a `filename` property. Older outlines only have Natural Earth's
 * uppercase columns, so fall back to the same ISO / Geounit code the processing script uses.
 */
export const featureFilename = (properties: Record<string, unknown>) => {
  if (properties.filename) return String(properties.filename);
  const isoCode = properties.ISO_A3 ?? properties.iso_a3;
  const code =
    isoCode && Number(isoCode) !== -99
      ? isoCode
      : (properties.GU_A3 ?? properties.gu_a3);
  return `${code}.geojson`;
};

/** Display name of a map feature, for either casing of Natural Earth's columns. */
export const featureName = (properties: Record<string, unknown>) =>
  String(properties.name ?? properties.NAME ?? "");

/**
 * Keeps only selected countries that exist in the chosen outlines
 * (the 110m set has fewer countries than 10m), and returns their URLs.
 */
export const downloadUrls = ({
  selected,
  index,
  basePath,
}: {
  selected: Iterable<string>;
  index: CountryIndex;
  basePath: string;
}) => {
  const available = new Set(
    Object.values(index.all).map(({ filename }) => filename),
  );
  return [...selected]
    .filter((filename) => available.has(filename))
    .map((filename) => `${basePath}/${filename}`);
};

/** Fetches each country, reporting progress as a 0–1 fraction, and merges them into one FeatureCollection. */
export const buildFeatureCollection = async ({
  urls,
  onprogress,
}: {
  urls: string[];
  onprogress: (fraction: number) => void;
}) => {
  let completed = 0;
  const features = await Promise.all(
    urls.map((url) =>
      fetchJson(url).then((feature) => {
        completed++;
        onprogress(completed / urls.length);
        return feature;
      }),
    ),
  );
  return { type: "FeatureCollection", features };
};
