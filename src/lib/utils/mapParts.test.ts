import { describe, expect, it } from 'vitest';
import { largestPart, nearestPart, polygonParts, type Bounds } from './mapParts.ts';

const west: Bounds = [
	[0, 0],
	[10, 10]
];
const east: Bounds = [
	[900, 0],
	[960, 60]
];

describe('polygonParts', () => {
	it('splits a multipolygon into polygons', () => {
		const geometry: GeoJSON.MultiPolygon = {
			type: 'MultiPolygon',
			coordinates: [
				[
					[
						[0, 0],
						[1, 0],
						[1, 1],
						[0, 0]
					]
				],
				[
					[
						[5, 5],
						[6, 5],
						[6, 6],
						[5, 5]
					]
				]
			]
		};
		expect(polygonParts(geometry)).toHaveLength(2);
	});

	it('returns nothing for a missing geometry', () => {
		expect(polygonParts(null)).toEqual([]);
	});
});

describe('largestPart / nearestPart', () => {
	it('picks the biggest box', () => {
		expect(largestPart([west, east])).toBe(east);
	});

	it("picks the piece nearest the pointer, e.g. Fiji's eastern or western side", () => {
		expect(nearestPart([west, east], [5, 5])).toBe(west);
		expect(nearestPart([west, east], [920, 20])).toBe(east);
	});
});
