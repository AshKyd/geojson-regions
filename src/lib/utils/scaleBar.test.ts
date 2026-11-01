import { describe, expect, it } from 'vitest';
import { formatDistance, niceDistanceKm, scaleBarAt } from './scaleBar.ts';

describe('niceDistanceKm', () => {
	it('rounds down to 1, 2 or 5 times a power of ten', () => {
		expect(niceDistanceKm(137)).toBe(100);
		expect(niceDistanceKm(240)).toBe(200);
		expect(niceDistanceKm(999)).toBe(500);
		expect(niceDistanceKm(1)).toBe(1);
		expect(niceDistanceKm(0.4)).toBe(0.2);
	});
});

describe('formatDistance', () => {
	it('uses kilometres, or metres when short', () => {
		expect(formatDistance(1000)).toMatch(/^1[,\s]?000 km$/);
		expect(formatDistance(50)).toBe('50 km');
		expect(formatDistance(0.2)).toBe('200 m');
	});
});

describe('scaleBarAt', () => {
	// 1° of longitude = 10px, so at the equator 1° ≈ 111.2 km ≈ 0.09 px per km.
	const project = ([lon, lat]: [number, number]): [number, number] => [lon * 10, lat * 10];

	it('fits within the pixel budget', () => {
		const bar = scaleBarAt({ project, centre: [0, 0], maxPixels: 100 });
		expect(bar).toBeDefined();
		expect(bar!.pixels).toBeLessThanOrEqual(100);
		expect(bar!.km).toBe(1000);
	});
});
