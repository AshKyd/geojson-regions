import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { simplifyPath } from './simplifyPath.ts';

describe('simplifyPath', () => {
	it('drops points closer than the tolerance to the last one kept', () => {
		assert.equal(simplifyPath('M0,0L0.1,0L0.2,0L5,0L5,5Z', 0.5), 'M0,0L5,0L5,5Z');
	});

	it('keeps every ring and its closing Z', () => {
		const path = 'M0,0L10,0L10,10ZM20,20L30,20L30,30Z';
		assert.equal(simplifyPath(path, 0.5), path);
	});

	it('drops rings that shrink below a triangle', () => {
		assert.equal(
			simplifyPath('M0,0L0.1,0L0.1,0.1ZM20,20L30,20L30,30Z', 0.5),
			'M20,20L30,20L30,30Z'
		);
	});

	it('leaves an open line open', () => {
		assert.equal(simplifyPath('M0,0L5,0L5,5', 0.5), 'M0,0L5,0L5,5');
	});

	it('handles negative coordinates', () => {
		assert.equal(simplifyPath('M-10,-10L-5,-10L-5,-5Z', 0.5), 'M-10,-10L-5,-10L-5,-5Z');
	});

	it('returns an empty string for an empty path', () => {
		assert.equal(simplifyPath('', 0.5), '');
	});
});
