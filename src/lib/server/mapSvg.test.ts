import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { mapToSvg } from './mapSvg.ts';

const map = {
	globe: 'M0,0L10,0L10,10Z',
	target: 'M2,2L8,2L8,8Z',
	neighbours: [{ code: 'NZL', name: 'New Zealand', d: 'M20,20L30,20L30,30Z' }],
	centre: [0, 0] as [number, number]
};

describe('mapToSvg', () => {
	it('sizes the image and draws the country, its neighbours and the globe', () => {
		const svg = mapToSvg(map, { width: 1200, height: 630 });
		assert.match(svg, /viewBox="0 0 1200 630"/);
		assert.match(svg, /d="M2,2L8,2L8,8Z"/);
		assert.match(svg, /d="M20,20L30,20L30,30Z"/);
		assert.match(svg, /d="M0,0L10,0L10,10Z"/);
	});

	it('masks the borders to the outside of the country', () => {
		assert.match(mapToSvg(map), /<mask id="outside-country"/);
		assert.match(mapToSvg(map), /mask="url\(#outside-country\)"/);
	});

	it('uses inline colours only, since a rasteriser has no page stylesheet', () => {
		assert.doesNotMatch(mapToSvg(map), /var\(--|class=/);
	});
});
