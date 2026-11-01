import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { filterCountries } from './filterCountries.ts';

const countries = [{ name: 'Åland' }, { name: 'Australia' }, { name: 'Austria' }];

describe('filterCountries', () => {
	it('returns everything for a blank query', () => {
		assert.equal(filterCountries(countries, '  ').length, 3);
	});

	it('matches anywhere in the name, ignoring case', () => {
		assert.deepEqual(
			filterCountries(countries, 'STRIA').map(({ name }) => name),
			['Austria']
		);
	});

	it('ignores accents', () => {
		assert.deepEqual(
			filterCountries(countries, 'aland').map(({ name }) => name),
			['Åland']
		);
	});
});
