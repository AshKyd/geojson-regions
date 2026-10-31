import { readFile } from "node:fs/promises";
import { join } from "node:path";

type CountryIndex = { all: Record<string, { filename: string; countryName: string }> };

/** Loads a set's `index.json`, which lists every country in that resolution. */
const loadIndex = (directory: string, resolution: string) =>
  readFile(join(directory, resolution, "index.json"), "utf8").then(
    (json) => JSON.parse(json) as CountryIndex,
  );

/**
 * Countries present at `detailed` resolution but absent from `light`.
 * The 110m set drops small states and territories, so these can't be seen on the preview map
 * (they still download fine from the higher resolutions).
 */
export const findMissing = ({
  light,
  detailed,
}: {
  light: CountryIndex;
  detailed: CountryIndex;
}) => {
  const lightFilenames = new Set(
    Object.values(light.all).map(({ filename }) => filename),
  );
  return Object.values(detailed.all)
    .filter(({ filename }) => !lightFilenames.has(filename))
    .sort((a, b) => a.countryName.localeCompare(b.countryName));
};

if (import.meta.main) {
  const [directory = "static/countries", detailedResolution = "10m"] =
    process.argv.slice(2);
  const [light, detailed] = await Promise.all([
    loadIndex(directory, "110m"),
    loadIndex(directory, detailedResolution),
  ]);
  const missing = findMissing({ light, detailed });
  missing.forEach(({ filename, countryName }) =>
    console.log(`${filename.replace(".geojson", "").padEnd(28)}${countryName}`),
  );
  console.log(
    `\n${missing.length} of ${Object.keys(detailed.all).length} ${detailedResolution} countries are missing from 110m`,
  );
}
