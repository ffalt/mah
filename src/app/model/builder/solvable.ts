import type { Mapping, Place } from '../types';
import type { Tile, Tiles } from '../tiles';
import { Stone } from '../stone';
import { BuilderBase } from './base';
import { RandomBoardBuilder } from './random';

export class SolvableBoardBuilder extends BuilderBase {
	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		// Initial a board with all matching faces
		const stones: Array<Stone> = [];
		mapping.forEach((st: Place) => {
			stones.push(new Stone(st[0], st[1], st[2], 0, 0));
		});
		BuilderBase.fillStones(stones, tiles); // grouping will be repaired later
		let runs = 1;
		// Play the board to get a solution until a valid pick is found
		let pairs = this.solve(stones, tiles);
		while (pairs.length === 0 && runs < 1000) {
			stones.forEach((stone: Stone) => {
				stone.picked = false;
				stone.v = 0;
				stone.groupnr = 0;
			});
			pairs = this.solve(stones, tiles);
			runs++;
		}
		if (pairs.length === 0) {
			const fallback = new RandomBoardBuilder();
			return fallback.build(mapping, tiles);
		}
		stones.forEach((stone: Stone) => {
			stone.picked = false;
		});
		BuilderBase.fillStones(stones, tiles); // repair grouping & images, etc
		stones.sort((a, b) => a.v - b.v);
		return stones;
	}

	solve(stones: Array<Stone>, tiles: Tiles): Array<Array<Tile>> {
		const pairs: Array<[Tile, Tile]> = [];
		const allPairs: Array<[Tile, Tile]> = [];
		const maxPairs = stones.length / 2;
		const groups = tiles.groups.slice();
		while (groups.length > 0) {
			const group = BuilderBase.randomExtract(groups);
			const g: Array<Tile> = group.tiles.slice();
			const tile1 = BuilderBase.randomExtract(g);
			const tile2 = BuilderBase.randomExtract(g);
			const tile3 = BuilderBase.randomExtract(g);
			const tile4 = g[0];
			if (allPairs.length < maxPairs) {
				allPairs.push([tile1, tile2]);
			}
			if (allPairs.length < maxPairs) {
				allPairs.push([tile3, tile4]);
			}
		}
		while (allPairs.length > 0) {
			const pair: [Tile, Tile] = BuilderBase.randomExtract(allPairs);
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
			place1.groupnr = pair[0].groupnr;
			place1.picked = true;
			place2.v = pair[1].v;
			place2.img = pair[1].img;
			place2.groupnr = pair[1].groupnr;
			place2.picked = true;
			pairs.push(pair);
		}
		return pairs;
	}
}
