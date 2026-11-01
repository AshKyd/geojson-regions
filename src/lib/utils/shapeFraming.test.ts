import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { geoOrthographic } from 'd3-geo';
import type { GeoBox } from './geoBoxes.ts';
import { framingProjection, globeCentre, isBoxInView } from './shapeFraming.ts';

const box = (west: number, south: number, east: number, north: number): GeoBox => [
	[west, south],
	[east, north]
];

describe('isBoxInView', () => {
	const australia: GeoJSON.Feature = {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'Polygon',
			// Clockwise, as d3 expects; the other way round would mean everything but Australia.
			coordinates: [
				[
					[113, -39],
					[113, -11],
					[153, -11],
					[153, -39],
					[113, -39]
				]
			]
		}
	};
	const project = framingProjection(australia) as (p: [number, number]) => [number, number];

	it('includes shapes inside the frame', () => {
		assert.equal(isBoxInView({ box: box(130, -30, 140, -20), project }), true);
	});

	it('includes shapes poking in from outside the frame', () => {
		assert.equal(isBoxInView({ box: box(150, -45, 175, -34), project }), true);
	});

	it('excludes shapes on the other side of the world', () => {
		assert.equal(isBoxInView({ box: box(-10, 40, 10, 50), project }), false);
	});

	it('handles boxes crossing the antimeridian', () => {
		const fiji = box(177, -20, -178, -16);
		assert.equal(isBoxInView({ box: fiji, project: geoOrthographic().rotate([-178, 0]) }), true);
	});
});

describe('globeCentre', () => {
	// Clockwise, as d3 expects, running round the whole of -60° latitude and the pole.
	const antarctica: GeoJSON.Feature = {
		type: 'Feature',
		properties: {},
		geometry: {
			type: 'Polygon',
			coordinates: [
				[
					[-180, -60],
					[-180, -90],
					[180, -90],
					[180, -60],
					[90, -60],
					[0, -60],
					[-90, -60],
					[-180, -60]
				]
			]
		}
	};

	it('centres a shape wrapping the south pole on the pole', () => {
		assert.deepEqual(globeCentre(antarctica), [0, -90]);
		const [x, y] = framingProjection(antarctica)([0, -90]) ?? [];
		assert.equal(Math.round(Number(x)), 480);
		assert.equal(Math.round(Number(y)), 270);
	});
});
