import { afterEach, describe, expect, it } from 'vitest';
import { generateBaseLayerChecker, isGridCorner } from './base-layer-checker';
import { resetRNG, seedRNG } from '../rng';
import { buildUnitGrids } from './utilities';

describe('isGridCorner', () => {
	const { xs, ys } = buildUnitGrids(6, 4, 1);

	it('accepts the four corners', () => {
		expect(isGridCorner(0, 0, xs, ys)).toBe(true);
		expect(isGridCorner(6, 0, xs, ys)).toBe(true);
		expect(isGridCorner(0, 4, xs, ys)).toBe(true);
		expect(isGridCorner(6, 4, xs, ys)).toBe(true);
	});

	// the old test was an OR across all four edges, which protected the whole perimeter
	it('rejects the rest of the perimeter', () => {
		expect(isGridCorner(3, 0, xs, ys)).toBe(false);
		expect(isGridCorner(3, 4, xs, ys)).toBe(false);
		expect(isGridCorner(0, 2, xs, ys)).toBe(false);
		expect(isGridCorner(6, 2, xs, ys)).toBe(false);
	});

	it('rejects interior cells', () => {
		expect(isGridCorner(3, 2, xs, ys)).toBe(false);
		expect(isGridCorner(1, 1, xs, ys)).toBe(false);
	});

	it('protects exactly four cells of a grid', () => {
		const corners = ys.flatMap(y => xs.filter(x => isGridCorner(x, y, xs, ys)).map(x => [x, y]));
		expect(corners).toHaveLength(4);
	});
});

describe('generateBaseLayerChecker', () => {
	afterEach(() => {
		resetRNG();
	});

	it('produces even, in-bounds coordinates on the base level', () => {
		seedRNG('checker-shape');
		const mapping = generateBaseLayerChecker({ minTarget: 40, maxTarget: 90, xMax: 36, yMax: 16 });

		expect(mapping.length).toBeGreaterThan(0);
		for (const [z, x, y] of mapping) {
			expect(z).toBe(0);
			expect(x % 2).toBe(0);
			expect(y % 2).toBe(0);
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x).toBeLessThanOrEqual(36);
			expect(y).toBeGreaterThanOrEqual(0);
			expect(y).toBeLessThanOrEqual(16);
		}
	});

	it('places no two tiles closer than two cells apart', () => {
		seedRNG('checker-overlap');
		const mapping = generateBaseLayerChecker({ minTarget: 40, maxTarget: 90, xMax: 36, yMax: 16 });
		const present = new Set(mapping.map(([, x, y]) => `${x}|${y}`));

		for (const [, x, y] of mapping) {
			for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
				expect(present.has(`${x + dx}|${y + dy}`)).toBe(false);
			}
		}
	});

	it('is deterministic for a given seed', () => {
		seedRNG('checker-repeat');
		const first = generateBaseLayerChecker({ minTarget: 40, maxTarget: 90, xMax: 36, yMax: 16 });
		resetRNG();
		seedRNG('checker-repeat');
		const second = generateBaseLayerChecker({ minTarget: 40, maxTarget: 90, xMax: 36, yMax: 16 });

		expect(second).toEqual(first);
	});
});
