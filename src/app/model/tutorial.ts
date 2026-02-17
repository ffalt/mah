import { Board } from './board';
import { Builder } from './builder';
import { Tiles } from './tiles';
import type { StoneMapping } from './types';

export interface TutorialStep {
	readonly id: string;
	readonly titleKey: string;
	readonly descriptionKey: string;
	readonly board: StoneMapping;
}

// Tile value formula: v = groupIndex * 4 + variant (variant 1-4)
// Circles 1 (group 0): v=1..4
// Circles 2 (group 1): v=5..8
// Circles 3 (group 2): v=9..12
// Seasons (group 27): v=109(spring), 110(summer), 111(fall), 112(winter)
// Flowers (group 32): v=129(bamboo), 130(chrysanthemum), 131(orchid), 132(plum)

export const TUTORIAL_STEPS: ReadonlyArray<TutorialStep> = [
	{
		id: 'first-match',
		titleKey: 'TUTORIAL_STEP1_TITLE',
		descriptionKey: 'TUTORIAL_STEP1_DESC',
		// 4 tiles in 2x2 grid, 2 pairs, all free
		board: [
			[0, 0, 0, 1], // Circles 1 (top-left)
			[0, 4, 0, 5], // Circles 2 (top-right)
			[0, 0, 2, 2], // Circles 1 (bottom-left)
			[0, 4, 2, 6] // Circles 2 (bottom-right)
		]
	},
	{
		id: 'blocked-tiles',
		titleKey: 'TUTORIAL_STEP2_TITLE',
		descriptionKey: 'TUTORIAL_STEP2_DESC',
		// Layer 1 tile blocks layer 0 tile; must remove top first
		board: [
			[0, 0, 0, 1], // Circles 1 (free, top-left)
			[0, 4, 0, 5], // Circles 2 (blocked by top)
			[0, 0, 2, 6], // Circles 2 (free, bottom-left)
			[1, 4, 0, 2] // Circles 1 (on top, free)
		]
	},
	{
		id: 'side-blocked',
		titleKey: 'TUTORIAL_STEP3_TITLE',
		descriptionKey: 'TUTORIAL_STEP3_DESC',
		// Center tile blocked by left and right neighbors
		board: [
			[0, 0, 0, 1], // Circles 1 (left blocker, free)
			[0, 2, 0, 5], // Circles 2 (center, side-blocked)
			[0, 4, 0, 2], // Circles 1 (right blocker, free)
			[0, 2, 2, 6] // Circles 2 (bottom, free, matches center)
		]
	},
	{
		id: 'tricky-tiles',
		titleKey: 'TUTORIAL_STEP4_TITLE',
		descriptionKey: 'TUTORIAL_STEP4_DESC',
		// 4 flowers in 2x2 grid with different images but same group
		board: [
			[0, 0, 0, 129], // Flower: Bamboo (top-left)
			[0, 4, 0, 130], // Flower: Chrysanthemum (top-right)
			[0, 0, 2, 131], // Flower: Orchid (bottom-left)
			[0, 4, 2, 132] // Flower: Plum (bottom-right)
		]
	},
	{
		id: 'challenge',
		titleKey: 'TUTORIAL_STEP5_TITLE',
		descriptionKey: 'TUTORIAL_STEP5_DESC',
		// Mixed: top-block, side-block, seasons in 3 rows
		board: [
			[0, 0, 0, 109], // Season: Spring (blocked by top)
			[0, 4, 0, 5], // Circles 2 (free)
			[1, 0, 0, 9], // Circles 3 (on top, blocks Spring)
			[0, 0, 2, 110], // Season: Summer (free, left blocker)
			[0, 2, 2, 1], // Circles 1 (side-blocked)
			[0, 4, 2, 10], // Circles 3 (free, right blocker)
			[0, 0, 4, 2], // Circles 1 (free)
			[0, 4, 4, 6] // Circles 2 (free)
		]
	}
];

/**
 * Creates a Board with predefined stones from a StoneMapping.
 * Uses Tiles(144) to ensure all tile groups (including flowers/seasons)
 * are available regardless of the small number of tiles in the tutorial.
 */
export function createTutorialBoard(mapping: StoneMapping): Board {
	const board = new Board();
	const tiles = new Tiles(144);
	const builder = new Builder(tiles);
	const stones = builder.load(mapping);
	if (stones) {
		board.stones = stones;
		board.update();
	}
	return board;
}
