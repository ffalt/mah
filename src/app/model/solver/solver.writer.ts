import { Group, Tile } from './solver.types';
import { Place } from '../types';
import { isPlayable } from './solver.tools';

export class SolverWriter {
	nTiles1: number;
	nTiles2: number;
	result: Array<Place> = [];

	constructor(
		nTilesCount: number,
		private readonly qt: Array<Group>,
		private readonly lo: Array<Array<Array<Tile | undefined>>>,
		private readonly nGroups: number,
		private readonly maxHeight: number,
		private readonly maxWidth: number,
		private readonly maxDepth: number
	) {
		this.nTiles1 = nTilesCount;
		this.nTiles2 = nTilesCount;
	}

	write() {
		// play until no tiles can be removed anymore
		do {
			this.nTiles1 = this.nTiles2;
			for (let k = 0; k < this.nGroups; k++) {
				this.writeGroup(k);
			}
		} while (this.nTiles2 !== this.nTiles1);
		return this.result;
	}

	private writePair(k: number, a: number, b: number) {
		const t1: Tile = this.qt[k].member[a] as Tile;
		const t2: Tile = this.qt[k].member[b] as Tile;
		for (let row = 0; row < this.maxHeight; row++) {
			for (let col = 0; col < this.maxWidth; col++) {
				for (let lev = 0; lev < this.maxDepth; lev++) {
					if (this.lo[row][col][lev] === t1 || this.lo[row][col][lev] === t2) {
						this.result.push([lev, col, row]);
					}
				}
			}
		}
	}

	private writePairing(k: number, qtk: Group, a: number, b: number): boolean {
		const qtmA = qtk.member[a] as Tile;
		const qtmB = qtk.member[b] as Tile;
		const tilesExist = qtmA && qtmB;
		const tilesNotPlayed = tilesExist && !qtmA.isPlayed;
		const tilesPlayable = tilesExist && isPlayable(qtmA) && isPlayable(qtmB);
		if (tilesExist && tilesNotPlayed && tilesPlayable) {
			this.writePair(k, a, b);
			qtmA.isPlayed = true;
			qtmB.isPlayed = true;
			this.nTiles2 -= 2;
			return true;
		}
		return false;
	}

	private writeGroup(k: number) {
		const qtk = this.qt[k];
		switch (qtk.bestPairing) {
			case 1: { // pairing 0-1, 2-3
				if (this.writePairing(k, qtk, 0, 1)) {
					const qtm2 = qtk.member[2] as Tile;
					qtk.isPlayed = qtm2.isPlayed;
				}
				this.writePairing(k, qtk, 2, 3);
				break;
			}
			case 2: { // pairing 0-2, 1-3
				this.writePairing(k, qtk, 0, 2);
				this.writePairing(k, qtk, 1, 3);
				break;
			}
			case 3: { // pairing 0-3, 1-2
				this.writePairing(k, qtk, 0, 3);
				this.writePairing(k, qtk, 1, 2);
				break;
			}
			case 4: { // half a group, pairing 0-1
				this.writePairing(k, qtk, 0, 1);
				break;
			}
			default: {
				break;
			}
		}
	}
}
