import {StoneMapping} from '../types';
import {Tile, Tiles} from '../tiles';
import {Stone} from '../stone';
import {BuilderBase} from './base';

export class LoadBoardBuilder {

	build(mapping: StoneMapping, tiles: Tiles): Array<Stone> {
		const stones: Array<Stone> = [];
		mapping.forEach((st: Array<number>) => {
			const tile: Tile = tiles.list[st[3]];
			if (tile) {
				const stone = new Stone(st[0], st[1], st[2], st[3], tile.groupnr);
				stones.push(stone);
			}
		});
		BuilderBase.fillStones(stones, tiles);
		return stones;
	}

}
