import { blocksOverlap, canPlace, type CellsFunction, generateBaseLayerWithShapes, inBounds, key } from './utilities';
import { X_MAX, Y_MAX, Z_MAX } from './consts';
import { resetRNG, seedRNG } from '../rng';
import { describe, it, expect } from 'vitest';

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

const rectCells: CellsFunction = (x0, y0, w, h) => {
	const cells: Array<[number, number]> = [];
	for (let row = 0; row < h; row++) {
		for (let column = 0; column < w; column++) {
			cells.push([x0 + column * 2, y0 + row * 2]);
		}
	}
	return cells;
};

describe('canPlace', () => {
	it('accepts an unused size on an empty board', () => {
		expect(canPlace(0, 0, 3, 3, new Set(), new Set(), new Set(), rectCells(0, 0, 3, 3))).toBe(true);
	});

	it('rejects an already used size by default', () => {
		expect(canPlace(0, 0, 3, 3, new Set(), new Set(), new Set(['3x3']), rectCells(0, 0, 3, 3))).toBe(false);
	});

	it('accepts an already used size when reuse is allowed', () => {
		expect(canPlace(0, 0, 3, 3, new Set(), new Set(), new Set(['3x3']), rectCells(0, 0, 3, 3), true)).toBe(true);
	});

	it('rejects cells that collide with an occupied position', () => {
		const occupied = new Set<string>([key(0, 2, 2)]);
		expect(canPlace(0, 0, 3, 3, occupied, new Set(), new Set(), rectCells(0, 0, 3, 3))).toBe(false);
	});
});

describe('generateBaseLayerWithShapes', () => {
	// a non-deterministic CellsFunction used to be called twice per attempt, so the shape that
	// passed validation was not the shape that got placed
	it('keeps the buffer distance when the cells function is not deterministic', () => {
		for (let seed = 0; seed < 20; seed++) {
			seedRNG(`shape-mismatch-${seed}`);
			let call = 0;
			const alternating: CellsFunction = (x0, y0) => {
				call++;
				return call % 2 === 0 ? [[x0 + 2, y0]] : [[x0, y0]];
			};

			const mapping = generateBaseLayerWithShapes(
				[[1, 1]],
				alternating,
				{ minTarget: 5, maxTarget: 10, xMax: X_MAX, yMax: Y_MAX }
			);
			resetRNG();

			expect(mapping.length).toBeGreaterThan(1);
			for (let a = 0; a < mapping.length; a++) {
				for (let b = a + 1; b < mapping.length; b++) {
					const distance = Math.max(Math.abs(mapping[a][1] - mapping[b][1]), Math.abs(mapping[a][2] - mapping[b][2]));
					expect(distance).toBeGreaterThan(3);
				}
			}
		}
	});

	it('reuses the only available size to reach the target', () => {
		const mapping = generateBaseLayerWithShapes(
			[[2, 2]],
			rectCells,
			{ minTarget: 40, maxTarget: 48, xMax: X_MAX, yMax: Y_MAX }
		);
		expect(mapping.length).toBeGreaterThan(4);
	});
});
