import {Tiles, Tile} from './tiles';
import {Stone} from './stone';
import {Layout, Place} from './layouts';

interface BuilderType {
	build(layout: Layout, tiles: Tiles): Array<Stone>;
}

function random<T>(array: Array<T>): number {
	return Math.floor(Math.random() * array.length);
}

function randomExtract<T>(array: Array<T>): T {
	const i = random(array);
	return array.splice(i, 1)[0];
}

const safeGetStone = (stones: Array<Stone>, z: number, x: number, y: number): Stone => {
	for (let i = 0, il = stones.length; i < il; i++) {
		if (stones[i].z === z && stones[i].x === x && stones[i].y === y) {
			return stones[i];
		}
	}
};

function collectNodes(stones: Array<Stone>, stone: Stone) {
	const nodes: {
		top: Array<Stone>;
		left: Array<Stone>;
		right: Array<Stone>;
		bottom: Array<Stone>;
	} = {left: [], right: [], top: [], bottom: []};
	let s: Stone;
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

const fillStones = function(stones: Array<Stone>, tiles: Tiles) {
	const groups: { [index: number]: Array<Stone> } = {};
	stones.forEach((stone: Stone) => {
		const tile = tiles.list[stone.v];
		if (tile) {
			stone.img = tile.img;
		} else {
			stone.img = {id: null};
		}
		groups[stone.groupnr] = groups[stone.groupnr] || [];
		groups[stone.groupnr].push(stone);
		stone.nodes = collectNodes(stones, stone);
	});
	Object.keys(groups).forEach((key) => {
		const group: Array<Stone> = groups[parseInt(key, 10)];
		group.forEach((stone: Stone) => {
			stone.group = group.filter((s: Stone) => {
				return s !== stone;
			});
		});
	});
	return stones;
};

class LinearBoardBuilder implements BuilderType {
	public build(layout: Layout, tiles: Tiles) {
		const remaining_tiles: Array<Tile> = tiles.list.filter((tile: Tile): boolean => {
			return tile != null;
		});
		const stones: Array<Stone> = [];
		layout.mapping.forEach((place: Place) => {
			const tile = randomExtract(remaining_tiles);
			const stone = new Stone(place[0], place[1], place[2], tile.v, tile.groupnr);
			stones.push(stone);
		});
		fillStones(stones, tiles);
		return stones;
	}
}

class RandomBoardBuilder implements BuilderType {
	public build(layout: Layout, tiles: Tiles) {
		const remaining_tiles = tiles.list.filter((tile: Tile) => {
			return tile != null;
		});
		const stones: Array<Stone> = [];
		const remaining_places = layout.mapping.slice(0);
		while (remaining_tiles.length > 0) {
			const tile = randomExtract(remaining_tiles);
			const place = randomExtract(remaining_places);
			stones.push(new Stone(place[0], place[1], place[2], tile.v, tile.groupnr));
		}
		fillStones(stones, tiles);
		return stones;
	}
}

class SolvableBoardBuilder implements BuilderType {
	public build(layout: Layout, tiles: Tiles) {
		const stones: Array<Stone> = [];
		layout.mapping.forEach((st: Place) => {
			stones.push(new Stone(st[0], st[1], st[2], 0, 0));
		});
		fillStones(stones, tiles); // grouping will be repaired later
		let pairs = this.solve(stones, tiles);
		let runs = 1;
		while (pairs.length === 0 && runs < 100) {
			stones.forEach((stone: Stone) => {
				stone.picked = false;
				stone.v = 0;
				stone.groupnr = 0;
			});
			pairs = this.solve(stones, tiles);
			runs++;
		}
		stones.forEach((stone: Stone) => {
			stone.picked = false;
		});
		fillStones(stones, tiles); // repair grouping & images, etc
		stones.sort((a: Stone, b: Stone) => {
			return a.v - b.v;
		});
		return stones;
	}

	private solve(stones: Array<Stone>, tiles: Tiles) {
		const pairs: Array<Array<Tile>> = [];
		const allpairs: Array<Array<Tile>> = [];
		tiles.groups.forEach((group) => {
			const g: Array<Tile> = group.tiles.slice();
			const tile1 = randomExtract(g);
			const tile2 = randomExtract(g);
			const tile3 = randomExtract(g);
			const tile4 = g[0];
			allpairs.push([tile1, tile2]);
			allpairs.push([tile3, tile4]);
		});
		while (allpairs.length > 0) {
			const pair: Array<Tile> = randomExtract(allpairs);
			const freestones: Array<Stone> = stones.filter((stone: Stone) => {
				return !stone.picked && !stone.isBlocked();
			});
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
	public build(layout: Layout, tiles: Tiles) {
		const stones: Array<Stone> = [];
		layout.mapping.forEach((st: Array<number>) => {
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
	{id: 'solvable', builder: SolvableBoardBuilder, name: 'Solvable'},
	{id: 'linear', builder: LinearBoardBuilder, name: 'Linear'},
	{id: 'random', builder: RandomBoardBuilder, name: 'Random'}
];

export class Builder {
	public tiles = new Tiles();
	public modes = BuilderModes;

	constructor() {
	}

	public build(mode: string, layout: Layout): Array<Stone> {
		let builder: BuilderType;
		if (mode === 'load') {
			builder = new LoadBoardBuilder();
		} else {
			const buildermode = BuilderModes.filter((m) => {
				return m.id === mode;
			})[0];
			builder = new buildermode.builder();
		}
		if (builder) {
			return builder.build(layout, this.tiles);
		}
	}
}
