import { readdir, rm, stat, readFile, writeFile } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { mapLimit } from "async";
import { brotliAt } from "./precompress.ts";

/**
 * Quality 9 is much faster than 11 (the best part of an hour over ~9,000 files, versus minutes).
 * On a sample of six large 10m countries the output was about 14% larger. Pass 11 as the second
 * argument for the smallest files, e.g. `node scripts/compress-geojson.ts static/countries 11`.
 */
const DEFAULT_QUALITY = 9;

/** Recursively lists every `.geojson` file under a directory. */
const listGeojson = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? listGeojson(join(directory, entry.name))
        : entry.name.endsWith(".geojson")
          ? [join(directory, entry.name)]
          : [],
    ),
  );
  return nested.flat();
};

/** Whether a Brotli copy already exists and is at least as new as its source. */
const isUpToDate = async (file: string) => {
  const [source, compressed] = await Promise.all([
    stat(file),
    stat(`${file}.br`).catch(() => undefined),
  ]);
  return Boolean(compressed) && compressed!.mtimeMs >= source.mtimeMs;
};

/**
 * Replaces every `.geojson` under `directory` with a `.geojson.br` at the given Brotli quality.
 * Only the `.br` files are committed; the dev server and Caddy serve them with
 * `Content-Encoding: br`. Compression runs one file per CPU core.
 */
export const compressGeojson = async (directory: string, quality = DEFAULT_QUALITY) => {
  const files = await listGeojson(directory);
  await mapLimit(files, availableParallelism(), async (file: string) => {
    // Skipping fresh copies keeps re-runs cheap, since quality 11 is slow.
    if (!(await isUpToDate(file))) {
      await writeFile(`${file}.br`, await brotliAt(await readFile(file), quality));
    }
    await rm(file);
  });
  return files.length;
};

if (import.meta.main) {
  const [directory = "static/countries", quality = DEFAULT_QUALITY] = process.argv.slice(2);
  const count = await compressGeojson(directory, Number(quality));
  console.log(JSON.stringify({ compressed: count, directory, quality: Number(quality) }));
}
