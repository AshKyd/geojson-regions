import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { loadCountry } from './countryData.ts';

// These read the real outline data in `static/countries`, as the prerender does.
describe('loadCountry map', () => {
	it('draws Antarctica, which wraps the pole', async () => {
		const details = await loadCountry('natural-earth', 'ATA');
		assert.ok(details);
		assert.ok(details.map.target.startsWith('M'));
		assert.deepEqual(details.map.centre, [0, -90]);
	});

	it('draws a country that crosses the antimeridian', async () => {
		const details = await loadCountry('natural-earth', 'FJI');
		assert.ok(details);
		assert.ok(details.map.target.length > 100);
	});

	it('only includes neighbours that have an outline, each with a path', async () => {
		const details = await loadCountry('natural-earth', 'AUS');
		assert.ok(details);
		assert.ok(details.map.neighbours.length > 0);
		assert.ok(details.map.neighbours.every(({ d }) => d.startsWith('M')));
	});

	it('frames the map for a custom size', async () => {
		const wide = await loadCountry('natural-earth', 'AUS', { width: 1200, height: 630 });
		const normal = await loadCountry('natural-earth', 'AUS');
		assert.ok(wide && normal);
		assert.notEqual(wide.map.target, normal.map.target);
	});
});
