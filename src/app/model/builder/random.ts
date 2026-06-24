import type { Mapping } from '../types';
import type { Tiles } from '../tiles';
import { Stone } from '../stone';
import { BuilderBase } from './base';

const MAX_REROLL_ATTEMPTS = 50;

export class RandomBoardBuilder extends BuilderBase {
	build(mapping: Mapping, tiles: Tiles): Array<Stone> {
		let stones = this.buildOnce(mapping, tiles);
		for (let attempt = 1; attempt < MAX_REROLL_ATTEMPTS; attempt++) {
			if (RandomBoardBuilder.hasFreePair(stones)) {
				break;
			}
			stones = this.buildOnce(mapping, tiles);
		}
		return stones;
	}

	private buildOnce(mapping: Mapping, tiles: Tiles): Array<Stone> {
		const remainingTiles = this.getTilesInGame(tiles, mapping.length);
		const stones: Array<Stone> = [];
		const remainingPlaces = [...mapping];
		while (remainingPlaces.length > 0 && remainingTiles.length > 0) {
			const tile = BuilderBase.randomExtract(remainingTiles);
			const place = BuilderBase.randomExtract(remainingPlaces);
			if (!tile || !place) {
				break;
			}
			stones.push(new Stone(place[0], place[1], place[2], tile.v, tile.groupNr));
		}
		BuilderBase.fillStones(stones, tiles);
		return stones;
	}

	private static hasFreePair(stones: Array<Stone>): boolean {
		const byGroup: { [g: number]: number } = {};
		for (const stone of stones) {
			if (stone.isBlocked()) {
				continue;
			}

			byGroup[stone.groupNr] = (byGroup[stone.groupNr] ?? 0) + 1;
			if (byGroup[stone.groupNr] >= 2) {
				return true;
			}
		}
		return false;
	}
}
