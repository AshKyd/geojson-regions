import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { mapLimit } from "async";
import { assignCodes, type Properties } from "./country-codes.ts";
import { findInvalidGeometries } from "./geometry-validity.ts";
import {
  COUNTRY_SOURCES,
  POINTS_OF_VIEW,
  type CountrySource,
} from "./sources.ts";

interface CountryFeature {
  type: "Feature";
  properties: Properties;
  geometry: unknown;
}

const outputRoot = process.argv[2] ?? "/output";

const log = (details: Record<string, unknown>) =>
  console.log(JSON.stringify(details));

/** The DBF reader leaves NUL padding on fixed-width strings. */
const cleanValue = (value: Properties[string]) =>
  typeof value === "string" ? value.replaceAll("\0", "").trim() : value;

/** Some Natural Earth files have uppercase property names, others lowercase. Normalise. */
const lowercaseKeys = (properties: Properties): Properties =>
  Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [
      key.toLowerCase(),
      cleanValue(value),
    ]),
  );

const execFileAsync = promisify(execFile);

/**
 * Downloads a zipped shapefile and converts it to GeoJSON with GDAL's `ogr2ogr`, which reads the
 * DBF's declared encoding itself. Geometry is passed through as published; it is not repaired.
 */
const downloadShapefile = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  const workDirectory = await mkdtemp(join(tmpdir(), "countries-"));
  try {
    const zipPath = join(workDirectory, "source.zip");
    const geojsonPath = join(workDirectory, "source.geojson");
    await writeFile(zipPath, Buffer.from(await response.arrayBuffer()));
    // /vsizip/ reads the shapefile inside the zip without unpacking it. crs:84 is lon/lat WGS84.
    await execFileAsync("ogr2ogr", [
      "-f", "GeoJSON",
      "-t_srs", "crs:84",
      geojsonPath,
      `/vsizip/${zipPath}`,
    ], { maxBuffer: 64 * 1024 * 1024 });
    return JSON.parse(await readFile(geojsonPath, "utf8")) as {
      features: CountryFeature[];
    };
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
};

const processSource = async ({ url, outputPath }: CountrySource) => {
  const { features } = await downloadShapefile(url);
  const outputDirectory = join(outputRoot, outputPath);
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  // Collect invalid geometries (self-intersections and the like); they're reported once, at the end.
  const invalid = findInvalidGeometries(features).map(({ position, reason }) => ({
    name: String(cleanValue(features[position]?.properties.NAME ?? features[position]?.properties.name ?? null)),
    reason,
    outputPath,
  }));

  // Name each feature. Features that share a code get distinct filenames instead of overwriting each other.
  const allProperties = features.map(({ properties }) => lowercaseKeys(properties));
  const codes = assignCodes(allProperties);
  const countries = features.map((feature, position) => {
    const code = codes[position]!;
    return {
      code,
      feature: {
        ...feature,
        properties: { ...allProperties[position], filename: `${code}.geojson` },
      },
    };
  });

  // Index: continent -> country name -> filename, plus `all` keyed by code.
  const index = countries.reduce<Record<string, Record<string, unknown>>>(
    (regions, { code, feature }) => {
      const { continent, name } = feature.properties;
      const filename = String(feature.properties.filename);
      regions[String(continent)] = {
        ...regions[String(continent)],
        [String(name)]: filename,
      };
      regions.all[code] = { filename, countryName: name };
      return regions;
    },
    { all: {} },
  );

  await Promise.all([
    ...countries.map(({ code, feature }) =>
      writeFile(join(outputDirectory, `${code}.geojson`), JSON.stringify(feature)),
    ),
    writeFile(join(outputDirectory, "index.json"), JSON.stringify(index)),
    writeFile(
      join(outputDirectory, "all.geojson"),
      JSON.stringify({
        type: "FeatureCollection",
        features: countries.map(({ feature }) => feature),
      }),
    ),
  ]);

  log({ outputPath, countries: countries.length });
  return invalid;
};

const invalidBySource = await mapLimit(COUNTRY_SOURCES, 3, processSource);

// The UI reads this to build the "point of view" picker.
await writeFile(join(outputRoot, "povs.json"), JSON.stringify(POINTS_OF_VIEW));

// The same upstream flaw usually repeats in every set (e.g. Egypt at 10m and in each point of view).
const invalidSummary = Object.values(
  invalidBySource.flat().reduce<Record<string, { name: string; reason: string; sets: string[] }>>(
    (groups, { name, reason, outputPath }) => {
      const key = `${name}|${reason}`;
      groups[key] = { name, reason, sets: [...(groups[key]?.sets ?? []), outputPath] };
      return groups;
    },
    {},
  ),
);
log({ done: true, sources: COUNTRY_SOURCES.length, invalidGeometries: invalidSummary });
