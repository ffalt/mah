/* eslint-disable max-classes-per-file */
import {safeGetStone, Stone} from './stone';
import {Tile, Tiles} from './tiles';
import {Mapping, Place} from './types';

interface BuilderType {
	build(mapping: Mapping, tiles: Tiles): Array<Stone>;
}

abstract class BuilderBase implements BuilderType {
	abstract build(mapping: Mapping, tiles: Tiles): Array<Stone>;

	getTilesInGame(tiles: Tiles, amount: number): Array<Tile> {
		return tiles.list.filter((tile: Tile) => tile !== undefined);
	}
}

function random<T>(array: Array<T>): number {
	return Math.floor(Math.random() * array.length);
}

function randomExtract<T>(array: Array<T>): T {
	const i = random(array);
	return array.splice(i, 1)[0];
}

function collectNodes(stones: Array<Stone>, stone: Stone): {
	top: Array<Stone>;
	left: Array<Stone>;
	right: Array<Stone>;
	bottom: Array<Stone>;
} {
	const nodes: {
		top: Array<Stone>;
		left: Array<Stone>;
		right: Array<Stone>;
		bottom: Array<Stone>;
	} = {left: [], right: [], top: [], bottom: []};
	let s: Stone | undefined;
	for (let y = stone.y - 1; y <= stone.y + 1; y++) {
		s = safeGetStone(stones, stone.z, stone.x - 2, y);
		if (s) {
			nodes.left.push(s);
		}
		s = safeGetStone(stones, stone.z, stone.x + 2, y);
		if (s) {
			nodes.right.push(s);
		}
		for (let x = stone.x - 1; x <= stone.x + 1; x++) {
			s = safeGetStone(stones, stone.z + 1, x, y);
			if (s) {
				nodes.top.push(s);
			}
			s = safeGetStone(stones, stone.z - 1, x, y);
			if (s) {
				nodes.bottom.push(s);
			}
		}
	}
	return nodes;
}

function fillStones(stones: Array<Stone>, tiles: Tiles): Array<Stone> {
	const groups: { [index: number]: Array<Stone> } = {};
	stones.forEach(stone => {
		const tile = tiles.list[stone.v];
		stone.img = tile ? tile.img : {id: undefined};
		groups[stone.groupnr] = groups[stone.groupnr] || [];
		groups[stone.groupnr].push(stone);
		stone.nodes = collectNodes(stones, stone);
	});
	Object.keys(groups).forEach(key => {
		const group: Array<Stone> = groups[Number(key)];
		group.forEach(stone => {
			stone.group = group.filter(s => s !== stone);
		});
	});
	return stones;
}

class LinearBoardBuilder extends BuilderBase {

	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		const remainingTiles = this.getTilesInGame(tiles, mapping.length);
		const stones: Array<Stone> = [];
		mapping.forEach(place => {
			const tile = randomExtract(remainingTiles);
			const stone = new Stone(place[0], place[1], place[2], tile.v, tile.groupnr);
			stones.push(stone);
		});
		fillStones(stones, tiles);
		return stones;
	}

}

class RandomBoardBuilder extends BuilderBase {

	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		const remainingTiles = this.getTilesInGame(tiles, mapping.length);
		const stones: Array<Stone> = [];
		const remainingPlaces = mapping.slice(0);
		while (remainingPlaces.length > 0) {
			const tile = randomExtract(remainingTiles);
			const place = randomExtract(remainingPlaces);
			if (!place) {
				console.log('Display', remainingPlaces, remainingTiles);
			}
			stones.push(new Stone(place[0], place[1], place[2], tile.v, tile.groupnr));
		}
		fillStones(stones, tiles);
		return stones;
	}
}

class SolvableBoardBuilder implements BuilderType {

	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		const stones: Array<Stone> = [];
		mapping.forEach((st: Place) => {
			stones.push(new Stone(st[0], st[1], st[2], 0, 0));
		});
		fillStones(stones, tiles); // grouping will be repaired later
		let pairs = this.solve(stones, tiles);
		let runs = 1;
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
			const linear = new LinearBoardBuilder();
			return linear.build(mapping, tiles);
		}
		stones.forEach((stone: Stone) => {
			stone.picked = false;
		});
		fillStones(stones, tiles); // repair grouping & images, etc
		stones.sort((a, b) => a.v - b.v);
		return stones;
	}

	solve(stones: Array<Stone>, tiles: Tiles): Array<Array<Tile>> {
		const pairs: Array<Array<Tile>> = [];
		const allPairs: Array<Array<Tile>> = [];
		const maxPairs = stones.length / 2;
		tiles.groups.forEach(group => {
			const g: Array<Tile> = group.tiles.slice();
			const tile1 = randomExtract(g);
			const tile2 = randomExtract(g);
			const tile3 = randomExtract(g);
			const tile4 = g[0];
			if (allPairs.length < maxPairs) {
				allPairs.push([tile1, tile2]);
			}
			if (allPairs.length < maxPairs) {
				allPairs.push([tile3, tile4]);
			}
		});
		while (allPairs.length > 0) {
			const pair: Array<Tile> = randomExtract(allPairs);
			const freestones: Array<Stone> = stones.filter((stone: Stone) =>
				!stone.picked && !stone.isBlocked());
			if (freestones.length < 2) {
				// not enough free places
				// this may happen if the last stones are directly on each other
				return [];
			}
			const place1 = randomExtract(freestones);
			const place2 = randomExtract(freestones);
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

class LoadBoardBuilder implements BuilderType {

	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		const stones: Array<Stone> = [];
		mapping.forEach((st: Array<number>) => {
			const tile: Tile = tiles.list[st[3]];
			if (tile) {
				const stone = new Stone(st[0], st[1], st[2], st[3], tile.groupnr);
				stones.push(stone);
			}
		});
		fillStones(stones, tiles);
		return stones;
	}

}

export const BuilderModes = [
	{id: 'MODE_SOLVABLE', builder: SolvableBoardBuilder},
	{id: 'MODE_LINEAR', builder: LinearBoardBuilder},
	{id: 'MODE_RANDOM', builder: RandomBoardBuilder}
];

export class Builder {
	tiles = new Tiles();
	modes = BuilderModes;

	build(mode: string, mapping: Mapping): Array<Stone> | undefined {
		let builder: BuilderType | undefined;
		if (mode === 'load') {
			builder = new LoadBoardBuilder();
		} else {
			const buildermode = BuilderModes.find(m => m.id === mode);
			if (buildermode) {
				builder = new buildermode.builder();
			}
		}
		if (builder) {
			return builder.build(mapping, this.tiles);
		}
		return;
	}
}
