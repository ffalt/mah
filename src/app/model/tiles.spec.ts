import { Tiles } from './tiles';
import { TILES, TILES_EXT } from './consts';
import { describe, it, expect } from 'vitest';

describe('Tiles', () => {
	describe('initialization', () => {
		it('should create an instance', () => {
			const tiles = new Tiles(4);
			expect(tiles).toBeTruthy();
		});

		it('should use extra tiles when needed', () => {
			// Create tiles for more than the standard tiles
			const standardTilesCount = TILES.length * 4;
			const tiles = new Tiles(standardTilesCount + 4);

			// Should include extra tiles
			const lastStandardGroupIndex = TILES.length - 1;
			const extraGroupIndex = lastStandardGroupIndex + 1;

			// Verify the extra group exists
			expect(tiles.groups[extraGroupIndex]).toBeDefined();

			// Verify the extra group has tiles with IDs from TILES_EXT
			const extraGroupTiles = tiles.groups[extraGroupIndex].tiles;
			expect(extraGroupTiles).toHaveLength(4);

			// The first extra tile should have an ID from TILES_EXT
			const extraTileId = extraGroupTiles[0].img.id;
			const extraTileIdFromConst = TILES_EXT[0][0];
			expect(extraTileId).toBe(extraTileIdFromConst);
		});

		it('should generate additional tiles when needed', () => {
			// Create tiles for more than standard + extra tiles
			const standardTilesCount = TILES.length * 4;
			const extraTilesCount = TILES_EXT.length * 4;
			const totalPredefinedTilesCount = standardTilesCount + extraTilesCount;

			// Request even more tiles
			const additionalTilesCount = 8; // 2 additional groups
			const tiles = new Tiles(totalPredefinedTilesCount + additionalTilesCount);

			// Should include generated tiles
			const lastPredefinedGroupIndex = TILES.length + TILES_EXT.length - 1;
			const generatedGroupIndex = lastPredefinedGroupIndex + 1;

			// Verify the generated group exists
			expect(tiles.groups[generatedGroupIndex]).toBeDefined();

			// Verify the generated group has tiles with generated IDs
			const generatedGroupTiles = tiles.groups[generatedGroupIndex].tiles;
			expect(generatedGroupTiles).toHaveLength(4);
		});

		it('should only ever use tile ids that a tileset can draw', () => {
			const drawableIds = new Set([...TILES.flat(), ...TILES_EXT.flat()]);
			const drawableGroups = TILES.length + TILES_EXT.length;

			const tiles = new Tiles((drawableGroups + 20) * 4);

			expect(tiles.groups.length).toBeGreaterThan(drawableGroups);
			for (const group of tiles.groups) {
				for (const tile of group.tiles) {
					expect(drawableIds).toContain(tile.img.id);
				}
			}
		});

		it('should reuse the drawable groups in order once they run out', () => {
			const drawableGroups = TILES.length + TILES_EXT.length;
			const tiles = new Tiles((drawableGroups + 2) * 4);

			expect(tiles.groups[drawableGroups].tiles.map(tile => tile.img.id))
				.toEqual(tiles.groups[0].tiles.map(tile => tile.img.id));
			expect(tiles.groups[drawableGroups + 1].tiles.map(tile => tile.img.id))
				.toEqual(tiles.groups[1].tiles.map(tile => tile.img.id));
		});

		it('should give each group its own tile objects', () => {
			const drawableGroups = TILES.length + TILES_EXT.length;
			const tiles = new Tiles((drawableGroups + 1) * 4);

			const original = tiles.groups[0].tiles[0];
			const reused = tiles.groups[drawableGroups].tiles[0];
			expect(reused.img.id).toBe(original.img.id);
			expect(reused.img).not.toBe(original.img);
			expect(reused.groupNr).not.toBe(original.groupNr);
			expect(reused.v).not.toBe(original.v);
		});

		it('should assign correct group numbers and values to tiles', () => {
			const tiles = new Tiles(8);

			// Check first group
			const group0 = tiles.groups[0];
			expect(group0.v).toBe(0);

			for (let index = 0; index < 4; index++) {
				const tile = group0.tiles[index];
				expect(tile.groupNr).toBe(0);
				expect(tile.v).toBe(index + 1);
			}

			// Check second group
			const group1 = tiles.groups[1];
			expect(group1.v).toBe(1);

			for (let index = 0; index < 4; index++) {
				const tile = group1.tiles[index];
				expect(tile.groupNr).toBe(1);
				expect(tile.v).toBe(index + 5);
			}
		});
	});
});
