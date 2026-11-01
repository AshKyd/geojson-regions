import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { pngPaletteSize } from './pngPaletteSize.ts';

/** A PNG-shaped buffer of chunks; checksums are zeroed since the reader doesn't check them. */
const pngWith = (chunks: { type: string; data: number[] }[]) => {
	const bytes = [137, 80, 78, 71, 13, 10, 26, 10];
	chunks.forEach(({ type, data }) => {
		const length = data.length;
		bytes.push(0, 0, length >> 8, length & 255);
		bytes.push(...[...type].map((letter) => letter.charCodeAt(0)));
		bytes.push(...data, 0, 0, 0, 0);
	});
	return new Uint8Array(bytes);
};

describe('pngPaletteSize', () => {
	it('counts the colours in the palette chunk', () => {
		const png = pngWith([
			{ type: 'IHDR', data: new Array(13).fill(0) },
			{ type: 'PLTE', data: new Array(9).fill(1) },
			{ type: 'IEND', data: [] }
		]);
		assert.equal(pngPaletteSize(png), 3);
	});

	it('is zero for a PNG without a palette', () => {
		const png = pngWith([
			{ type: 'IHDR', data: new Array(13).fill(0) },
			{ type: 'IEND', data: [] }
		]);
		assert.equal(pngPaletteSize(png), 0);
	});
});
