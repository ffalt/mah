import {Mapping} from '../types';
import {Tiles} from '../tiles';
import {Stone} from '../stone';
import {BuilderBase} from './base';

export class LinearBoardBuilder extends BuilderBase {

	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		const remainingTiles = this.getTilesInGame(tiles, mapping.length);
		const stones: Array<Stone> = [];
		mapping.forEach(place => {
			const tile = BuilderBase.randomExtract(remainingTiles);
			const stone = new Stone(place[0], place[1], place[2], tile.v, tile.groupnr);
			stones.push(stone);
		});
		BuilderBase.fillStones(stones, tiles);
		return stones;
	}

}
