import { RandomBoardBuilder } from './random';
import { Tiles } from '../tiles';
import type { Mapping } from '../types';
import { describe, beforeEach, it, expect } from 'vitest';

describe('RandomBoardBuilder', () => {
	let builder: RandomBoardBuilder;

	beforeEach(() => {
		builder = new RandomBoardBuilder();
	});

	it('should create an instance', () => {
		expect(builder).toBeTruthy();
	});

	describe('build', () => {
		it('should return one stone per mapping entry', () => {
			const mapping: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			expect(stones).toHaveLength(4);
		});

		it('should return empty array for empty mapping', () => {
			const mapping: Mapping = [];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			expect(stones).toHaveLength(0);
		});

		it('should place stones at positions from the mapping', () => {
			const mapping: Mapping = [[0, 0, 0], [1, 2, 2], [2, 4, 4], [0, 6, 6]];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			const positions = stones.map(s => [s.z, s.x, s.y]);
			for (const place of mapping) {
				expect(positions).toContainEqual([place[0], place[1], place[2]]);
			}
		});

		it('should assign a positive tile value to every stone', () => {
			const mapping: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			for (const stone of stones) {
				expect(stone.v).toBeGreaterThan(0);
			}
		});

		it('should set img data on stones via fillStones', () => {
			const mapping: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			for (const stone of stones) {
				expect(stone.img).toBeDefined();
			}
		});

		it('should assign tile values that exist in the tiles list', () => {
			const mapping: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			for (const stone of stones) {
				expect(tiles.list[stone.v]).toBeDefined();
			}
		});

		it('should populate stone group arrays via fillStones', () => {
			const mapping: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			for (const stone of stones) {
				expect(Array.isArray(stone.group)).toBe(true);
			}
		});

		it('should assign groupNr matching the tile group', () => {
			const mapping: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			for (const stone of stones) {
				const tile = tiles.list[stone.v];
				expect(stone.groupNr).toBe(tile.groupNr);
			}
		});

		it('should assign each tile value at most once', () => {
			const mapping: Mapping = [[0, 0, 0], [0, 2, 0], [0, 4, 0], [0, 6, 0]];
			const tiles = new Tiles(4);
			const stones = builder.build(mapping, tiles);
			const values = stones.map(s => s.v);
			const unique = new Set(values);
			expect(unique.size).toBe(values.length);
		});

		it('should produce a valid layout for a larger board', () => {
			const mapping: Mapping = Array.from({ length: 144 }, (_, index) => [0, index * 2, 0] as [number, number, number]);
			const tiles = new Tiles(144);
			const stones = builder.build(mapping, tiles);
			expect(stones).toHaveLength(144);
		});

		it('should place every tile group an even number of times so all stones are matchable', () => {
			// A sub-144 board: drawing single tiles could leave a group with an odd (unmatchable) count.
			const mapping: Mapping = Array.from({ length: 30 }, (_, index) => [0, index * 2, 0] as [number, number, number]);
			const tiles = new Tiles(30);
			const stones = builder.build(mapping, tiles);
			expect(stones).toHaveLength(30);
			const counts: Record<number, number> = {};
			for (const stone of stones) {
				counts[stone.groupNr] = (counts[stone.groupNr] ?? 0) + 1;
			}
			for (const count of Object.values(counts)) {
				expect(count % 2).toBe(0);
			}
		});

		it('should produce different tile assignments on repeated calls', () => {
			const mapping: Mapping = Array.from({ length: 16 }, (_, index) => [0, index * 2, 0] as [number, number, number]);
			let differs = false;
			for (let attempt = 0; attempt < 10; attempt++) {
				const stones1 = builder.build([...mapping], new Tiles(16));
				const stones2 = builder.build([...mapping], new Tiles(16));
				if (stones1.some((s, index) => s.v !== stones2[index].v)) {
					differs = true;
					break;
				}
			}
			expect(differs).toBe(true);
		});
	});
});
