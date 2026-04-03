import type { Mapping } from '../types';
import type { Tile, Tiles } from '../tiles';
import { type Stone, safeGetStone } from '../stone';
import { randomExtract, shuffledCopy } from '../array-utilities';

export interface BuilderType {
	build(mapping: Mapping, tiles: Tiles): Array<Stone>;
}

export abstract class BuilderBase implements BuilderType {
	abstract build(mapping: Mapping, tiles: Tiles): Array<Stone>;

	static randomExtract<T>(array: Array<T>): T {
		return randomExtract(array);
	}

	static randomList<T>(array: Array<T>): Array<T> {
		return shuffledCopy(array);
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
		} = { left: [], right: [], top: [], bottom: [] };
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
		for (const stone of stones) {
			const tile = tiles.list[stone.v];
			stone.img = tile?.img ?? {};
			groups[stone.groupNr] = groups[stone.groupNr] || [];
			groups[stone.groupNr].push(stone);
			stone.nodes = BuilderBase.collectNodes(stones, stone);
		}
		for (const key of Object.keys(groups)) {
			const group: Array<Stone> = groups[Number(key)];
			for (const stone of group) {
				stone.group = group.filter(s => s !== stone);
			}
		}
		return stones;
	}

	getTilesInGame(tiles: Tiles, _amount: number): Array<Tile> {
		return tiles.list.filter((tile: Tile) => tile !== undefined);
	}
}
