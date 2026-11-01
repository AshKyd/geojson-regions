import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { groupByInitial } from './groupByInitial.ts';

describe('groupByInitial', () => {
	it('groups by first letter, in alphabetical order', () => {
		const groups = groupByInitial([{ name: 'Brazil' }, { name: 'Albania' }, { name: 'Bahrain' }]);
		assert.deepEqual(
			groups.map(({ initial, items }) => [initial, items.map(({ name }) => name)]),
			[
				['A', ['Albania']],
				['B', ['Brazil', 'Bahrain']]
			]
		);
	});

	it('files accented names under their plain letter', () => {
		const [group] = groupByInitial([{ name: 'Åland' }]);
		assert.equal(group?.initial, 'A');
	});
});
