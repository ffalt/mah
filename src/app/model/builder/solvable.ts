import type { Mapping } from '../types';
import type { Tile, Tiles } from '../tiles';
import { Stone } from '../stone';
import { BuilderBase } from './base';
import { RandomBoardBuilder } from './random';

export class SolvableBoardBuilder extends BuilderBase {
	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		// Initial a board with all matching faces
		const stones: Array<Stone> = [];
		for (const st of mapping) {
			stones.push(new Stone(st[0], st[1], st[2], 0, 0));
		}
		BuilderBase.fillStones(stones, tiles); // grouping will be repaired later
		let runs = 1;
		// Play the board to get a solution until a valid pick is found
		let pairs = this.solve(stones, tiles);
		while (pairs.length === 0 && runs < 1000) {
			for (const stone of stones) {
				stone.picked = false;
				stone.v = 0;
				stone.groupNr = 0;
			}
			pairs = this.solve(stones, tiles);
			runs++;
		}
		if (pairs.length === 0) {
			const fallback = new RandomBoardBuilder();
			return fallback.build(mapping, tiles);
		}
		for (const stone of stones) {
			stone.picked = false;
		}
		BuilderBase.fillStones(stones, tiles); // repair grouping & images, etc
		stones.sort((a, b) => a.v - b.v);
		return stones;
	}

	solve(stones: Array<Stone>, tiles: Tiles): Array<Array<Tile>> {
		const pairs: Array<[Tile, Tile]> = [];
		const allPairs: Array<[Tile, Tile]> = [];
		const maxPairs = stones.length / 2;
		const groups = BuilderBase.randomList(tiles.groups);
		for (const group of groups) {
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
				// not enough free places
				// this may happen if the last stones are directly on each other
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
