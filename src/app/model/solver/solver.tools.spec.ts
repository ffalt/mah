import { describe, expect, it } from 'vitest';
import { rand, randBelow } from './solver.tools';

describe('solver.tools', () => {
	function draws(count: number, next: () => number): Array<number> {
		return Array.from({ length: count }, () => next());
	}

	describe('rand', () => {
		it('stays inside 0..99', () => {
			const values = draws(20_000, () => rand());
			expect(Math.min(...values)).toBeGreaterThanOrEqual(0);
			expect(Math.max(...values)).toBeLessThan(100);
			expect(values.every(value => Number.isSafeInteger(value))).toBe(true);
		});
	});

	describe('randBelow', () => {
		it('stays inside 0..max-1', () => {
			const values = draws(20_000, () => randBelow(7));
			expect(Math.min(...values)).toBe(0);
			expect(Math.max(...values)).toBe(6);
			expect(values.every(value => Number.isSafeInteger(value))).toBe(true);
		});

		// the search-order shuffle in solver.init needs the whole range, not the
		// 0..99 that `rand() % range` was limited to
		it('reaches past 100 for a range wider than 100', () => {
			const values = draws(20_000, () => randBelow(500));
			expect(Math.max(...values)).toBeGreaterThanOrEqual(400);
			expect(Math.max(...values)).toBeLessThan(500);
			expect(values.filter(value => value >= 100).length).toBeGreaterThan(0);
		});

		it('covers the range roughly evenly', () => {
			const buckets = [0, 0, 0, 0, 0];
			const values = draws(50_000, () => randBelow(500));
			for (const value of values) {
				buckets[Math.floor(value / 100)]++;
			}
			for (const bucket of buckets) {
				expect(bucket).toBeGreaterThan(50_000 / 5 * 0.8);
			}
		});

		it('returns 0 for an empty range', () => {
			expect(randBelow(0)).toBe(0);
			expect(randBelow(-1)).toBe(0);
		});
	});
});
