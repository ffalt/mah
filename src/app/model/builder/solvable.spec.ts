import { SolvableBoardBuilder, SolvableBoardBuilderBase } from './solvable';
import { Tiles } from '../tiles';
import type { Mapping } from '../types';
import { BuilderModes, MODE_SOLVABLE } from '../builder';
import { describe, beforeEach, it, expect } from 'vitest';

// A flat 4-stone mapping - 2 pairs, no overlaps, no blocking
const MAPPING_4: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];

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

describe('BuilderModes registry', () => {
	it('should include MODE_SOLVABLE', () => {
		const entry = BuilderModes.find(m => m.id === MODE_SOLVABLE);
		expect(entry).toBeDefined();
	});

	it('MODE_SOLVABLE builder should be SolvableBoardBuilder', () => {
		const entry = BuilderModes.find(m => m.id === MODE_SOLVABLE)!;
		expect(new entry.builder()).toBeInstanceOf(SolvableBoardBuilder);
	});
});
