import { Tiles } from './tiles';
import { TILES, TILES_EXT } from './consts';

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

			// The generated tile should have an ID with a specific pattern
			const generatedTileId = generatedGroupTiles[0].img.id;
			expect(generatedTileId).toMatch(/^_\d+[a-d]$/);
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
