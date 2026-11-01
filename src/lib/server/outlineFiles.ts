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

export const readText = async (path: string) =>
	readFile(path, 'utf8').catch(async () =>
		(await brotliDecompressAsync(await readFile(`${path}.br`))).toString('utf8')
	);

export const readJson = async <T>(path: string) => JSON.parse(await readText(path)) as T;

/** Folder under `static/countries` holding a point of view's 10m outlines. */
export const outlinesDirectory = (pov: string) =>
	pov === NATURAL_EARTH_SLUG ? '10m' : `pov/${pov}/10m`;
