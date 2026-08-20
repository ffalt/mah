import { describe, it, expect } from 'vitest';
import type { Mapping, Place } from '../types';
import { mulberry32, rng, stringToSeed } from '../rng';
import { generateSeededRandomMapping, maxSeedAttempts, retrySeeded } from './random-layout';

// 144 places over two levels, the shape generateRandomMapping is contracted to return
function boardMapping(): Mapping {
	return Array.from({ length: 144 }, (_value, index): Place => [index < 72 ? 0 : 1, (index % 72) * 2, 0]);
}

// the first draw of a seeded generator identifies the seed the retry actually applied
function firstDrawOf(seed: string): number {
	return mulberry32(stringToSeed(seed))();
}

describe('retrySeeded', () => {
	it('uses the bare seed when the first attempt yields a mapping', () => {
		const draws: Array<number> = [];
		const mapping = retrySeeded('daily-2026-08-06', () => {
			draws.push(rng());
			return boardMapping();
		});
		expect(mapping).toHaveLength(144);
		expect(draws).toEqual([firstDrawOf('daily-2026-08-06')]);
	});

	it('walks a numbered suffix until an attempt yields a mapping', () => {
		const draws: Array<number> = [];
		let attempts = 0;
		const mapping = retrySeeded('seed', () => {
			draws.push(rng());
			attempts++;
			// the bare seed and the first two suffixes come up empty
			return attempts > 3 ? boardMapping() : [];
		});
		expect(mapping).toHaveLength(144);
		expect(draws).toEqual(['seed', 'seed-1', 'seed-2', 'seed-3'].map(seed => firstDrawOf(seed)));
	});

	it('gives up at the attempt cap instead of walking suffixes forever', () => {
		let attempts = 0;
		const mapping = retrySeeded('seed', () => {
			attempts++;
			return [];
		});
		expect(mapping).toHaveLength(0);
		expect(attempts).toBe(maxSeedAttempts);
	});

	it('hands the RNG back after an exhausted walk', () => {
		retrySeeded('seed', () => []);
		expect(rng()).not.toBe(rng());
	});

	it('hands the RNG back once it is done', () => {
		retrySeeded('seed', () => boardMapping());
		// a seeded generator repeats, the restored Math.random one does not
		expect(rng()).not.toBe(rng());
	});
});

describe('generateSeededRandomMapping', () => {
	it('never returns an empty board', () => {
		expect(generateSeededRandomMapping('daily-2026-08-06', 'random', 'random', 'random')).toHaveLength(144);
	});

	// the combination the layout list can pin, and the one the unmirrored fallback exists for
	it('never returns an empty board with symmetry pinned on both axes', () => {
		expect(generateSeededRandomMapping('daily-2026-08-06', 'true', 'true', 'random')).toHaveLength(144);
	});

	it('returns the same board for the same seed', () => {
		const first = generateSeededRandomMapping('daily-2026-08-06', 'random', 'random', 'random');
		const second = generateSeededRandomMapping('daily-2026-08-06', 'random', 'random', 'random');
		expect(second).toEqual(first);
	});

	it('returns a different board for a different seed', () => {
		const first = generateSeededRandomMapping('daily-2026-08-06', 'random', 'random', 'random');
		const other = generateSeededRandomMapping('daily-2026-08-07', 'random', 'random', 'random');
		expect(other).not.toEqual(first);
	});
});
