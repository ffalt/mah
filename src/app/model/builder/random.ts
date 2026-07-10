import type { Mapping } from '../types';
import type { Tile, Tiles } from '../tiles';
import { Stone } from '../stone';
import { BuilderBase } from './base';
import { shuffledCopy } from '../array-utilities';

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

	getTilesInGame(tiles: Tiles, amount: number): Array<Tile> {
		// Draw complete pairs so every group placed on the board has an even tile count
		const need = Math.floor(amount / 2) * 2;
		const result: Array<Tile> = [];
		for (const group of shuffledCopy(tiles.groups)) {
			for (let index = 0; index + 1 < group.tiles.length && result.length < need; index += 2) {
				result.push(group.tiles[index], group.tiles[index + 1]);
			}
			if (result.length >= need) {
				break;
			}
		}
		return result;
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
