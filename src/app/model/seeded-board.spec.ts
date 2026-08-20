import { describe, it, expect, afterEach } from 'vitest';
import { Board } from './board';
import { MODE_SOLVABLE, MODE_RANDOM } from './builder';
import { resetRNG, seedRNG } from './rng';
import { generateRandomMapping } from './random-layout/random-layout';
import type { Mapping, StonePlace } from './types';

function buildWithSeed(seed: string, mapping: Mapping, mode: typeof MODE_SOLVABLE | typeof MODE_RANDOM): Array<StonePlace> {
	seedRNG(seed);
	try {
		const board = new Board();
		board.applyMapping(mapping, mode);
		return board.save();
	} finally {
		resetRNG();
	}
}

function simpleMapping(): Mapping {
	const mapping: Mapping = [];
	for (let y = 0; y < 8; y += 2) {
		for (let x = 0; x < 36; x += 2) {
			mapping.push([0, x, y]);
		}
	}
	return mapping;
}

describe('seeded board generation', () => {
	afterEach(() => {
		resetRNG();
	});

	it('produces the identical tile assignment for the same seed', () => {
		const mapping = simpleMapping();
		const first = buildWithSeed('daily-2026-07-30', mapping, MODE_SOLVABLE);
		const second = buildWithSeed('daily-2026-07-30', mapping, MODE_SOLVABLE);
		expect(first.length).toBe(mapping.length);
		expect(second).toEqual(first);
	});

	it('produces a different tile assignment for a different seed', () => {
		const mapping = simpleMapping();
		const first = buildWithSeed('daily-2026-07-30', mapping, MODE_SOLVABLE);
		const second = buildWithSeed('daily-2026-07-31', mapping, MODE_SOLVABLE);
		expect(second).not.toEqual(first);
	});

	it('is deterministic for the random fill mode too', () => {
		const mapping = simpleMapping();
		const first = buildWithSeed('seed-a', mapping, MODE_RANDOM);
		const second = buildWithSeed('seed-a', mapping, MODE_RANDOM);
		expect(second).toEqual(first);
	});

	it('reproduces layout shape and tile assignment together', () => {
		const build = (seed: string) => {
			seedRNG(seed);
			try {
				const mapping = generateRandomMapping('random', 'random', 'random');
				const board = new Board();
				board.applyMapping(mapping, MODE_SOLVABLE);
				return { mapping, stones: board.save() };
			} finally {
				resetRNG();
			}
		};
		const first = build('daily-2026-08-01');
		const second = build('daily-2026-08-01');
		expect(first.mapping.length).toBe(144);
		expect(second.mapping).toEqual(first.mapping);
		expect(second.stones).toEqual(first.stones);
	});
});
