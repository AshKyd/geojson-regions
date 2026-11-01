import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { featureToSvg } from './outlineSvg.ts';

const square: GeoJSON.Feature = {
	type: 'Feature',
	properties: {},
	geometry: {
		type: 'Polygon',
		coordinates: [
			[
				[10, 10],
				[10, 20],
				[20, 20],
				[20, 10],
				[10, 10]
			]
		]
	}
};

describe('featureToSvg', () => {
	const svg = featureToSvg(square);

	it('draws the country as a single path', () => {
		assert.equal(svg.match(/<path /g)?.length, 1);
		assert.match(svg, /<path d="M[^"]+"\/>/);
	});

	it('has a tight viewBox starting at the origin', () => {
		assert.match(svg, /viewBox="0 0 [\d.]+ [\d.]+"/);
	});

	it('leaves all colouring to the user', () => {
		assert.doesNotMatch(svg, /fill|stroke|style|class/);
	});

	describe('with info', () => {
		const described = featureToSvg(square, {
			countryName: 'Squareland & Co',
			countryCode: 'SQR',
			povName: 'Argentina',
			povSlug: 'arg',
			isDeFacto: false,
			pageUrl: 'https://example.test/countries/SQR/arg'
		});

		it('says which country and point of view it draws, and where it came from', () => {
			assert.match(described, /<title>Squareland &#38; Co according to Argentina<\/title>/);
			assert.match(described, /<dc:identifier>SQR-arg<\/dc:identifier>/);
			assert.match(described, /Natural Earth/);
			assert.match(described, /<dc:publisher>https:\/\/example\.test\/countries\/SQR\/arg</);
		});

		it('is still a single unstyled path', () => {
			assert.equal(described.match(/<path /g)?.length, 1);
			assert.doesNotMatch(described, /fill|stroke|style|class/);
		});
	});
});
