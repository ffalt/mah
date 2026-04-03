import type { Mapping } from '../types';
import type { Tile, Tiles } from '../tiles';
import { Stone } from '../stone';
import { BuilderBase } from './base';
import { RandomBoardBuilder } from './random';

const MAX_RUNS = 2000;
const MAX_ALTERNATIVE_ATTEMPTS = 10;

export class SolvableBoardBuilder extends BuilderBase {
	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		// Try the standard solvable algorithm
		const result = this.buildSolvableWithRetries(mapping, tiles, MAX_RUNS);
		if (result) {
			return result;
		}

		// If standard algorithm fails, try alternative strategy
		const alternativeResult = this.buildSolvableAlternative(mapping, tiles);
		if (alternativeResult) {
			return alternativeResult;
		}

		// Last resort: create a random board and try to solve it
		// This ensures we always return a board, even if not guaranteed solvable
		const randomBoard = new RandomBoardBuilder();
		return randomBoard.build(mapping, tiles);
	}

	private buildSolvableWithRetries(mapping: Mapping, tiles: Tiles, maxRuns: number): Array<Stone> | undefined {
		// Initialize a board with all matching faces
		const stones: Array<Stone> = [];
		for (const st of mapping) {
			stones.push(new Stone(st[0], st[1], st[2], 0, 0));
		}
		BuilderBase.fillStones(stones, tiles); // grouping will be repaired later

		let runs = 0;
		let pairs = this.assignTilePairs(stones, tiles);
		while (pairs.length === 0 && runs < maxRuns) {
			// Reset stones for retry
			for (const stone of stones) {
				stone.picked = false;
				stone.v = 0;
				stone.groupNr = 0;
			}
			pairs = this.assignTilePairs(stones, tiles);
			runs++;
		}

		if (pairs.length === 0) {
			return undefined;
		}

		return this.finalizeBoard(stones, tiles);
	}

	private buildSolvableAlternative(mapping: Mapping, tiles: Tiles): Array<Stone> | undefined {
		// Alternative strategy: try building from scratch multiple times with different tile selection
		for (let attempt = 0; attempt < MAX_ALTERNATIVE_ATTEMPTS; attempt++) {
			const stones: Array<Stone> = [];
			for (const st of mapping) {
				stones.push(new Stone(st[0], st[1], st[2], 0, 0));
			}
			BuilderBase.fillStones(stones, tiles);

			// Try to solve with reversed group order for variety
			const pairs = this.assignTilePairs(stones, tiles, attempt % 2 !== 0);
			if (pairs.length > 0) {
				return this.finalizeBoard(stones, tiles);
			}
		}
		return undefined;
	}

	private finalizeBoard(stones: Array<Stone>, tiles: Tiles): Array<Stone> {
		for (const stone of stones) {
			stone.picked = false;
		}
		BuilderBase.fillStones(stones, tiles);
		stones.sort((a, b) => a.v - b.v);
		return stones;
	}

	private assignTilePairs(stones: Array<Stone>, tiles: Tiles, reverse = false): Array<Array<Tile>> {
		const pairs: Array<[Tile, Tile]> = [];
		const allPairs: Array<[Tile, Tile]> = [];
		const maxPairs = stones.length / 2;

		const groupList = BuilderBase.randomList(tiles.groups);
		if (reverse) {
			groupList.reverse();
		}

		for (const group of groupList) {
			const g: Array<Tile> = BuilderBase.randomList(group.tiles);
			for (let index = 0; index + 1 < g.length; index += 2) {
				if (allPairs.length < maxPairs) {
					allPairs.push([g[index], g[index + 1]]);
				}
			}
			if (allPairs.length >= maxPairs) {
				break;
			}
		}

		const randomPairs = BuilderBase.randomList(allPairs);
		for (const pair of randomPairs) {
			const freestones: Array<Stone> = stones.filter((stone: Stone) =>
				!stone.picked && !stone.isBlocked());
			if (freestones.length < 2) {
				return [];
			}
			const place1 = BuilderBase.randomExtract(freestones);
			const place2 = BuilderBase.randomExtract(freestones);
			place1.v = pair[0].v;
			place1.img = pair[0].img;
			place1.groupNr = pair[0].groupNr;
			place1.picked = true;
			place2.v = pair[1].v;
			place2.img = pair[1].img;
			place2.groupNr = pair[1].groupNr;
			place2.picked = true;
			pairs.push(pair);
		}
		return pairs;
	}
}
