import { readFile } from 'node:fs/promises';
import { resolve as resolvePath } from 'node:path';
import { promisify } from 'node:util';
import { brotliDecompress } from 'node:zlib';
import { NATURAL_EARTH_SLUG } from '#lib/constants.ts';

/**
 * Build-time view of the outline data in `static/countries`, used to prerender the browse pages.
 * Only `.geojson.br` files are committed, so reads fall back to decompressing those.
 */
export const countriesDirectory = resolvePath('static/countries');
const brotliDecompressAsync = promisify(brotliDecompress);

/**
 * Prerendering asks for thousands of outlines at once (every point of view times every country),
 * and the big 10m ones decompress to several MB each. Unbounded, they all sit in memory together
 * and the build is killed, so only a few are read at a time and the rest wait their turn.
 */
const MAX_CONCURRENT_READS = 8;
const waitingReads: Array<() => void> = [];
let activeReads = 0;

const withReadSlot = async <T>(read: () => Promise<T>) => {
	if (activeReads >= MAX_CONCURRENT_READS)
		await new Promise<void>((release) => waitingReads.push(release));
	activeReads++;
	return read().finally(() => {
		activeReads--;
		waitingReads.shift()?.();
	});
};

export const readText = (path: string) =>
	withReadSlot(() =>
		readFile(path, 'utf8').catch(async () =>
			(await brotliDecompressAsync(await readFile(`${path}.br`))).toString('utf8')
		)
	);

export const readJson = async <T>(path: string) => JSON.parse(await readText(path)) as T;

/** Folder under `static/countries` holding a point of view's 10m outlines. */
export const outlinesDirectory = (pov: string) =>
	pov === NATURAL_EARTH_SLUG ? '10m' : `pov/${pov}/10m`;
