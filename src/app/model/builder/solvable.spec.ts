import { SolvableBoardBuilder, SolvableBoardBuilderBase } from './solvable';
import { SolvableBoardBuilderEasy } from './solvable-easy';
import { SolvableBoardBuilderExpert } from './solvable-expert';
import { Tiles } from '../tiles';
import type { Mapping } from '../types';
import { BuilderModes, MODE_SOLVABLE, MODE_SOLVABLE_EASY, MODE_SOLVABLE_EXPERT, solvableModeForGameMode } from '../builder';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, GAME_MODE_STANDARD } from '../consts';

// A flat 4-stone mapping - 2 pairs, no overlaps, no blocking
const MAPPING_4: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];

// A flat 8-stone mapping - 4 pairs, none blocking
const MAPPING_8: Mapping = [
	[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0],
	[0, 8, 0], [0, 10, 0], [0, 12, 0], [0, 14, 0]
];

// A flat 16-stone mapping - 8 pairs, none blocking
const MAPPING_16: Mapping = Array.from({ length: 16 }, (_, index) => [0, index * 2, 0] as [number, number, number]);

describe('SolvableBoardBuilder (Standard)', () => {
	let builder: SolvableBoardBuilder;

	beforeEach(() => {
		builder = new SolvableBoardBuilder();
	});

	it('should be an instance of SolvableBoardBuilderBase', () => {
		expect(builder).toBeInstanceOf(SolvableBoardBuilderBase);
	});

	it('should produce a board for a 4-stone mapping', () => {
		const stones = builder.build(MAPPING_4, new Tiles(4));
		expect(stones).toHaveLength(4);
	});

	it('should produce a board for a 16-stone mapping', () => {
		const stones = builder.build(MAPPING_16, new Tiles(16));
		expect(stones).toHaveLength(16);
	});

	it('should assign matched pairs (each stone has at least one same-groupNr partner)', () => {
		const stones = builder.build(MAPPING_16, new Tiles(16));
		for (const stone of stones) {
			const partners = stones.filter(s => s !== stone && s.groupNr === stone.groupNr);
			expect(partners.length).toBeGreaterThanOrEqual(1);
		}
	});

	it('should assign a positive tile value to every stone', () => {
		const stones = builder.build(MAPPING_4, new Tiles(4));
		for (const stone of stones) {
			expect(stone.v).toBeGreaterThan(0);
		}
	});
});

describe('SolvableBoardBuilderEasy', () => {
	let builder: SolvableBoardBuilderEasy;

	beforeEach(() => {
		builder = new SolvableBoardBuilderEasy();
	});

	it('should be an instance of SolvableBoardBuilderBase', () => {
		expect(builder).toBeInstanceOf(SolvableBoardBuilderBase);
	});

	it('should produce a valid board for a 16-stone mapping', () => {
		const stones = builder.build(MAPPING_16, new Tiles(16));
		expect(stones).toHaveLength(16);
		for (const stone of stones) {
			expect(stone.v).toBeGreaterThan(0);
		}
	});

	it('should fall back and still return a board when the constraint is impossible (4-stone layout)', () => {
		// With only 4 stones, freestones.length can never reach 8 (Easy min).
		// The constrained step must exhaust retries and fall back to unconstrained.
		const stones = builder.build(MAPPING_4, new Tiles(4));
		expect(stones).toHaveLength(4);
		for (const stone of stones) {
			expect(stone.v).toBeGreaterThan(0);
		}
	});

	it('should fall back and still return a board when the constraint is impossible (8-stone layout)', () => {
		// With 8 flat unblocked stones, all 8 are free initially (freestones = 8 = min boundary).
		// After first pair picked, freestones = 6 < 8, so constraint fails from step 2 onward.
		// Should still produce a valid board via fallback.
		const stones = builder.build(MAPPING_8, new Tiles(8));
		expect(stones).toHaveLength(8);
	});
});

describe('SolvableBoardBuilderExpert', () => {
	let builder: SolvableBoardBuilderExpert;

	beforeEach(() => {
		builder = new SolvableBoardBuilderExpert();
	});

	it('should be an instance of SolvableBoardBuilderBase', () => {
		expect(builder).toBeInstanceOf(SolvableBoardBuilderBase);
	});

	it('should produce a valid board for a 16-stone mapping', () => {
		// 16 flat stones are all unblocked (freestones = 16 > 4), so constraint fails.
		// Falls back to unconstrained - should still return valid board.
		const stones = builder.build(MAPPING_16, new Tiles(16));
		expect(stones).toHaveLength(16);
		for (const stone of stones) {
			expect(stone.v).toBeGreaterThan(0);
		}
	});

	it('should produce a valid board for a 4-stone mapping (constraint satisfied)', () => {
		// 4 flat unblocked stones: freestones = 4 <= 4, constraint passes.
		const stones = builder.build(MAPPING_4, new Tiles(4));
		expect(stones).toHaveLength(4);
		for (const stone of stones) {
			expect(stone.v).toBeGreaterThan(0);
		}
	});
});

describe('BuilderModes registry', () => {
	it('should include MODE_SOLVABLE_EASY', () => {
		const entry = BuilderModes.find(m => m.id === MODE_SOLVABLE_EASY);
		expect(entry).toBeDefined();
	});

	it('should include MODE_SOLVABLE_EXPERT', () => {
		const entry = BuilderModes.find(m => m.id === MODE_SOLVABLE_EXPERT);
		expect(entry).toBeDefined();
	});

	it('MODE_SOLVABLE_EASY builder should be SolvableBoardBuilderEasy', () => {
		const entry = BuilderModes.find(m => m.id === MODE_SOLVABLE_EASY)!;
		expect(new entry.builder()).toBeInstanceOf(SolvableBoardBuilderEasy);
	});

	it('MODE_SOLVABLE_EXPERT builder should be SolvableBoardBuilderExpert', () => {
		const entry = BuilderModes.find(m => m.id === MODE_SOLVABLE_EXPERT)!;
		expect(new entry.builder()).toBeInstanceOf(SolvableBoardBuilderExpert);
	});

	it('MODE_SOLVABLE builder should still be SolvableBoardBuilder (unchanged)', () => {
		const entry = BuilderModes.find(m => m.id === MODE_SOLVABLE)!;
		expect(new entry.builder()).toBeInstanceOf(SolvableBoardBuilder);
	});
});

describe('solvableModeForGameMode', () => {
	it('should return MODE_SOLVABLE_EASY for GAME_MODE_EASY', () => {
		expect(solvableModeForGameMode(GAME_MODE_EASY)).toBe(MODE_SOLVABLE_EASY);
	});

	it('should return MODE_SOLVABLE_EXPERT for GAME_MODE_EXPERT', () => {
		expect(solvableModeForGameMode(GAME_MODE_EXPERT)).toBe(MODE_SOLVABLE_EXPERT);
	});

	it('should return MODE_SOLVABLE for GAME_MODE_STANDARD', () => {
		expect(solvableModeForGameMode(GAME_MODE_STANDARD)).toBe(MODE_SOLVABLE);
	});
});
