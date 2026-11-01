import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { isIsoAlpha3 } from './isoCodes.ts';

describe('isIsoAlpha3', () => {
	it('accepts three-letter country codes', () => {
		assert.equal(isIsoAlpha3('AUS'), true);
	});

	it('rejects named disputed areas', () => {
		assert.equal(isIsoAlpha3('kosovo'), false);
		assert.equal(isIsoAlpha3('baikonur'), false);
	});

	it('rejects three-letter codes with no ISO standing', () => {
		assert.equal(isIsoAlpha3('SOL'), false);
		assert.equal(isIsoAlpha3('CYN'), false);
	});
});
