import { LoadBoardBuilder } from './load';
import { Tiles } from '../tiles';
import type { StoneMapping } from '../types';
import { describe, beforeEach, it, expect } from 'vitest';

describe('LoadBoardBuilder', () => {
	let builder: LoadBoardBuilder;

	beforeEach(() => {
		builder = new LoadBoardBuilder();
	});

	it('should create an instance', () => {
		expect(builder).toBeTruthy();
	});

	describe('build', () => {
		it('returns empty array for empty mapping', () => {
			const stones = builder.build([], new Tiles(4));
			expect(stones).toHaveLength(0);
		});

		it('creates one stone per valid mapping entry', () => {
			const mapping: StoneMapping = [
				[0, 0, 0, 1],
				[0, 2, 0, 2],
				[0, 4, 0, 3],
				[0, 6, 0, 4]
			];
			const stones = builder.build(mapping, new Tiles(4));
			expect(stones).toHaveLength(4);
		});

		it('skips entries whose tile index is out of range', () => {
			const mapping: StoneMapping = [
				[0, 0, 0, 1],
				[0, 2, 0, 9999]
			];
			const stones = builder.build(mapping, new Tiles(4));
			expect(stones).toHaveLength(1);
		});

		it('assigns z, x, y, v from the mapping entry', () => {
			const mapping: StoneMapping = [[1, 2, 4, 1]];
			const stones = builder.build(mapping, new Tiles(4));
			expect(stones[0].z).toBe(1);
			expect(stones[0].x).toBe(2);
			expect(stones[0].y).toBe(4);
			expect(stones[0].v).toBe(1);
		});

		it('assigns groupNr matching the tile group', () => {
			const tiles = new Tiles(8);
			const mapping: StoneMapping = [
				[0, 0, 0, 1],
				[0, 2, 0, 2],
				[0, 4, 0, 3],
				[0, 6, 0, 4]
			];
			const stones = builder.build(mapping, tiles);
			for (const stone of stones) {
				const tile = tiles.list[stone.v];
				expect(stone.groupNr).toBe(tile.groupNr);
			}
		});

		it('sets img on every stone via fillStones', () => {
			const mapping: StoneMapping = [
				[0, 0, 0, 1],
				[0, 2, 0, 2],
				[0, 4, 0, 3],
				[0, 6, 0, 4]
			];
			const stones = builder.build(mapping, new Tiles(4));
			for (const stone of stones) {
				expect(stone.img).toBeDefined();
			}
		});

		it('populates stone group arrays via fillStones', () => {
			const mapping: StoneMapping = [
				[0, 0, 0, 1],
				[0, 2, 0, 2],
				[0, 4, 0, 3],
				[0, 6, 0, 4]
			];
			const stones = builder.build(mapping, new Tiles(4));
			for (const stone of stones) {
				expect(Array.isArray(stone.group)).toBe(true);
			}
		});
	});
});
