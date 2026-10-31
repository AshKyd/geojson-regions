import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { brotliCompress, constants } from "node:zlib";
import { mapLimit } from "async";

const brotliCompressAsync = promisify(brotliCompress);

/**
 * Text formats worth compressing. Images and fonts are already compressed. `.geojson` is left out:
 * those are compressed once, by `compress-geojson`, and only the `.br` files are committed.
 */
const COMPRESSIBLE = /\.(json|js|mjs|css|html|svg|webmanifest|txt|map)$/;

/**
 * Compresses a buffer with Brotli at the given quality (0-11) and a 16MiB window.
 * Browsers can't decode the non-standard "large window" extension, so the window stops at 24 bits.
 */
export const brotliAt = (input: Buffer, quality: number) =>
  brotliCompressAsync(input, {
    params: {
      [constants.BROTLI_PARAM_QUALITY]: quality,
      [constants.BROTLI_PARAM_LGWIN]: constants.BROTLI_MAX_WINDOW_BITS,
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_SIZE_HINT]: input.length,
    },
  });

/**
 * Slowest, smallest setting (quality 11). The site build uses this: it runs once at deploy time
 * and the output is served as-is, so CPU time doesn't matter.
 */
export const brotliMax = (input: Buffer) =>
  brotliAt(input, constants.BROTLI_MAX_QUALITY);

/** Recursively lists every file under a directory. */
const listFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? listFiles(join(directory, entry.name))
        : [join(directory, entry.name)],
    ),
  );
  return nested.flat();
};

/**
 * Writes a `.br` sibling next to every compressible file under `directory`.
 * Returns the number of files compressed.
 */
export const precompressDirectory = async (directory: string) => {
  const files = (await listFiles(directory)).filter((file) =>
    COMPRESSIBLE.test(file),
  );
  await mapLimit(files, 4, async (file: string) => {
    const compressed = await brotliMax(await readFile(file));
    await writeFile(`${file}.br`, compressed);
  });
  return files.length;
};

if (import.meta.main) {
  const [directory = ""] = process.argv.slice(2);
  if (!directory) {
    console.error("Usage: node precompress.ts <directory>");
    process.exit(1);
  }
  const count = await precompressDirectory(directory);
  console.log(JSON.stringify({ precompressed: count, directory }));
}
