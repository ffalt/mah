import {Mapping} from '../types';
import {Tile, Tiles} from '../tiles';
import {safeGetStone, Stone} from '../stone';

export interface BuilderType {
	build(mapping: Mapping, tiles: Tiles): Array<Stone>;
}

export abstract class BuilderBase implements BuilderType {
	abstract build(mapping: Mapping, tiles: Tiles): Array<Stone>;

	static random<T>(array: Array<T>): number {
		return Math.floor(Math.random() * array.length);
	}

	static randomExtract<T>(array: Array<T>): T {
		const i = BuilderBase.random(array);
		return array.splice(i, 1)[0];
	}

	static collectNodes(stones: Array<Stone>, stone: Stone): {
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

	static fillStones(stones: Array<Stone>, tiles: Tiles): Array<Stone> {
		const groups: { [index: number]: Array<Stone> } = {};
		stones.forEach(stone => {
			const tile = tiles.list[stone.v];
			stone.img = tile ? tile.img : {id: undefined};
			groups[stone.groupnr] = groups[stone.groupnr] || [];
			groups[stone.groupnr].push(stone);
			stone.nodes = BuilderBase.collectNodes(stones, stone);
		});
		Object.keys(groups).forEach(key => {
			const group: Array<Stone> = groups[Number(key)];
			group.forEach(stone => {
				stone.group = group.filter(s => s !== stone);
			});
		});
		return stones;
	}

	getTilesInGame(tiles: Tiles, amount: number): Array<Tile> {
		return tiles.list.filter((tile: Tile) => tile !== undefined);
	}

	getTilesInPairs(tiles: Tiles, amount: number): Array<[Tile, Tile]> {
		const result: Array<[Tile, Tile]> = [];
		tiles.groups.forEach(group => {
			for (let i = 0; i < group.tiles.length; i += 2) {
				result.push([group.tiles[i], group.tiles[i + 1]]);
			}
		});
		return result;
	}

}
