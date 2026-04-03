import { blocksOverlap, inBounds, key } from './utilities';
import { X_MAX, Y_MAX, Z_MAX } from './consts';

describe('inBounds', () => {
	it('returns true for the origin (0, 0, 0)', () => {
		expect(inBounds(0, 0, 0)).toBe(true);
	});

	it('returns true for max values (X_MAX, Y_MAX, Z_MAX)', () => {
		expect(inBounds(X_MAX, Y_MAX, Z_MAX)).toBe(true);
	});

	it('returns true for a point in the middle of the grid', () => {
		expect(inBounds(18, 8, 2)).toBe(true);
	});

	it('returns false when x is negative', () => {
		expect(inBounds(-1, 0, 0)).toBe(false);
	});

	it('returns false when y is negative', () => {
		expect(inBounds(0, -1, 0)).toBe(false);
	});

	it('returns false when z is negative', () => {
		expect(inBounds(0, 0, -1)).toBe(false);
	});

	it('returns false when x exceeds X_MAX', () => {
		expect(inBounds(X_MAX + 1, 0, 0)).toBe(false);
	});

	it('returns false when y exceeds Y_MAX', () => {
		expect(inBounds(0, Y_MAX + 1, 0)).toBe(false);
	});

	it('returns false when z exceeds Z_MAX', () => {
		expect(inBounds(0, 0, Z_MAX + 1)).toBe(false);
	});

	it('returns true at exact boundary X_MAX', () => {
		expect(inBounds(X_MAX, 0, 0)).toBe(true);
	});

	it('returns true at exact boundary Y_MAX', () => {
		expect(inBounds(0, Y_MAX, 0)).toBe(true);
	});

	it('returns true at exact boundary Z_MAX', () => {
		expect(inBounds(0, 0, Z_MAX)).toBe(true);
	});

	it('returns false when all values are negative', () => {
		expect(inBounds(-5, -3, -1)).toBe(false);
	});

	it('returns false when all values exceed maximums', () => {
		expect(inBounds(X_MAX + 10, Y_MAX + 10, Z_MAX + 10)).toBe(false);
	});
});

describe('blocksOverlap', () => {
	it('returns false for an empty set', () => {
		const present = new Set<string>();
		expect(blocksOverlap(present, 0, 4, 4)).toBe(false);
	});

	it('returns false when only the center position itself is present', () => {
		const present = new Set<string>([key(0, 4, 4)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(false);
	});

	it('returns true when a tile exists directly above (x, y-1)', () => {
		const present = new Set<string>([key(0, 4, 3)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns true when a tile exists directly below (x, y+1)', () => {
		const present = new Set<string>([key(0, 4, 5)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns true when a tile exists to the left (x-1, y)', () => {
		const present = new Set<string>([key(0, 3, 4)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns true when a tile exists to the right (x+1, y)', () => {
		const present = new Set<string>([key(0, 5, 4)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns true when a tile exists at top-left diagonal (x-1, y-1)', () => {
		const present = new Set<string>([key(0, 3, 3)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns true when a tile exists at top-right diagonal (x+1, y-1)', () => {
		const present = new Set<string>([key(0, 5, 3)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns true when a tile exists at bottom-left diagonal (x-1, y+1)', () => {
		const present = new Set<string>([key(0, 3, 5)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns true when a tile exists at bottom-right diagonal (x+1, y+1)', () => {
		const present = new Set<string>([key(0, 5, 5)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns false when neighbors exist on a different z level', () => {
		const present = new Set<string>([
			key(1, 3, 3), key(1, 4, 3), key(1, 5, 3),
			key(1, 3, 4), key(1, 5, 4),
			key(1, 3, 5), key(1, 4, 5), key(1, 5, 5)
		]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(false);
	});

	it('returns true when all 8 neighbors are present on the same z', () => {
		const present = new Set<string>([
			key(0, 3, 3), key(0, 4, 3), key(0, 5, 3),
			key(0, 3, 4), key(0, 5, 4),
			key(0, 3, 5), key(0, 4, 5), key(0, 5, 5)
		]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});

	it('returns false when tiles are 2 steps away (no adjacency)', () => {
		const present = new Set<string>([
			key(0, 2, 2), key(0, 6, 2),
			key(0, 2, 6), key(0, 6, 6),
			key(0, 4, 2), key(0, 4, 6),
			key(0, 2, 4), key(0, 6, 4)
		]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(false);
	});

	it('works correctly at the origin (0, 0, 0)', () => {
		const present = new Set<string>([key(0, 1, 0)]);
		expect(blocksOverlap(present, 0, 0, 0)).toBe(true);
	});

	it('detects overlap on higher z levels', () => {
		const present = new Set<string>([key(2, 10, 5)]);
		expect(blocksOverlap(present, 2, 10, 4)).toBe(true);
	});

	it('returns true early on first matching neighbor (short-circuit on x-1, y-1)', () => {
		const present = new Set<string>([key(0, 3, 3)]);
		expect(blocksOverlap(present, 0, 4, 4)).toBe(true);
	});
});
