import type { Mapping } from '../types';
import type { Tiles } from '../tiles';
import { Stone } from '../stone';
import { BuilderBase } from './base';

export class RandomBoardBuilder extends BuilderBase {
	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		const remainingTiles = this.getTilesInGame(tiles, mapping.length);
		const stones: Array<Stone> = [];
		const remainingPlaces = [...mapping];
		while (remainingPlaces.length > 0) {
			const tile = BuilderBase.randomExtract(remainingTiles);
			const place = BuilderBase.randomExtract(remainingPlaces);
			stones.push(new Stone(place[0], place[1], place[2], tile.v, tile.groupNr));
		}
		BuilderBase.fillStones(stones, tiles);
		return stones;
	}
}
