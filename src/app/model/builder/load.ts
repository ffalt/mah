import type { StoneMapping } from '../types';
import type { Tile, Tiles } from '../tiles';
import { Stone } from '../stone';
import { BuilderBase } from './base';

export class LoadBoardBuilder {
	build(mapping: StoneMapping, tiles: Tiles): Array<Stone> {
		const stones: Array<Stone> = [];
		for (const st of mapping) {
			const tile: Tile = tiles.list[st[3]];
			if (tile) {
				const stone = new Stone(st[0], st[1], st[2], st[3], tile.groupNr);
				stones.push(stone);
			}
		}
		BuilderBase.fillStones(stones, tiles);
		return stones;
	}
}
