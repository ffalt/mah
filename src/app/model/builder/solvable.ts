import type { Mapping } from '../types';
import type { Tile, Tiles } from '../tiles';
import { Stone } from '../stone';
import { BuilderBase } from './base';
import { RandomBoardBuilder } from './random';

const MAX_RUNS = 2000;
const MAX_ALTERNATIVE_ATTEMPTS = 10;

export interface BreadthConstraint {
	min: number;
	max: number;
}

export abstract class SolvableBoardBuilderBase extends BuilderBase {
	protected maxRuns: number = MAX_RUNS;

	protected breadthConstraint(): BreadthConstraint | undefined {
		return undefined;
	}

	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		const breadth = this.breadthConstraint();

		// Step 1: constrained attempt (skipped when no constraint)
		if (breadth) {
			const result = this.buildSolvableWithRetries(mapping, tiles, this.maxRuns, breadth);
			if (result) {
				return result;
			}
		}

		// Step 2: unconstrained solvable (always tried; same as original behaviour for Standard)
		const unconstrained = this.buildSolvableWithRetries(mapping, tiles, MAX_RUNS, undefined);
		if (unconstrained) {
			return unconstrained;
		}

		// Step 3: alternative strategy (reversed group order)
		const alternative = this.buildSolvableAlternative(mapping, tiles);
		if (alternative) {
			return alternative;
		}

		// Step 4: last resort - random fill, possibly unsolvable
		const randomBoard = new RandomBoardBuilder();
		return randomBoard.build(mapping, tiles);
	}

	private buildSolvableWithRetries(mapping: Mapping, tiles: Tiles, maxRuns: number, breadth: BreadthConstraint | undefined): Array<Stone> | undefined {
		const stones: Array<Stone> = [];
		for (const st of mapping) {
			stones.push(new Stone(st[0], st[1], st[2], 0, 0));
		}
		BuilderBase.fillStones(stones, tiles);

		let runs = 0;
		let pairs = this.assignTilePairs(stones, tiles, false, breadth);
		while (pairs.length === 0 && runs < maxRuns) {
			for (const stone of stones) {
				stone.picked = false;
				stone.v = 0;
				stone.groupNr = 0;
			}
			pairs = this.assignTilePairs(stones, tiles, false, breadth);
			runs++;
		}

		if (pairs.length === 0) {
			return undefined;
		}

		return this.finalizeBoard(stones, tiles);
	}

	private buildSolvableAlternative(mapping: Mapping, tiles: Tiles): Array<Stone> | undefined {
		for (let attempt = 0; attempt < MAX_ALTERNATIVE_ATTEMPTS; attempt++) {
			const stones: Array<Stone> = [];
			for (const st of mapping) {
				stones.push(new Stone(st[0], st[1], st[2], 0, 0));
			}
			BuilderBase.fillStones(stones, tiles);

			const pairs = this.assignTilePairs(stones, tiles, attempt % 2 !== 0, undefined);
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

	private assignTilePairs(stones: Array<Stone>, tiles: Tiles, reverse: boolean, breadth: BreadthConstraint | undefined): Array<Array<Tile>> {
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
			if (breadth && (freestones.length < breadth.min || freestones.length > breadth.max)) {
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

// Standard solvable - no breadth constraint (original behaviour)
export class SolvableBoardBuilder extends SolvableBoardBuilderBase {
}
