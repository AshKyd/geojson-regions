import { describe, expect, it } from 'vitest';
import { allowsMapGesture } from './mapZoom.ts';

const touch = (type: string, count: number) =>
	Object.assign(new Event(type), { touches: new Array(count).fill({}) });

describe('allowsMapGesture', () => {
	it('ignores one-finger touches so the page can scroll', () => {
		expect(allowsMapGesture(touch('touchstart', 1))).toBe(false);
	});

	it('accepts two-finger touches', () => {
		expect(allowsMapGesture(touch('touchstart', 2))).toBe(true);
	});

	it('accepts cmd-wheel and ctrl-wheel (trackpad pinch)', () => {
		expect(allowsMapGesture(Object.assign(new Event('wheel'), { ctrlKey: true }))).toBe(true);
		expect(allowsMapGesture(Object.assign(new Event('wheel'), { metaKey: true }))).toBe(true);
	});

	it('ignores a plain wheel so the page can scroll', () => {
		expect(allowsMapGesture(Object.assign(new Event('wheel'), { ctrlKey: false, metaKey: false }))).toBe(false);
	});

	it('accepts a left-button drag but not other buttons', () => {
		expect(allowsMapGesture(Object.assign(new Event('mousedown'), { button: 0 }))).toBe(true);
		expect(allowsMapGesture(Object.assign(new Event('mousedown'), { button: 2 }))).toBe(false);
	});
});
