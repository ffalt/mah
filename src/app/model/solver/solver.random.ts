import { isPlayable, randBelow } from './solver.tools';
import type { Group, Tile, TileNeighboursAboveBelow, TileNeighboursLeftRight } from './solver.types';

export class SolverRandomSolve {
	nrPlays: number = 0;

	constructor(
		private readonly nTilesCount: number,
		private readonly nGroups: number,
		private readonly tileList: Array<Tile>,
		private readonly tileGroups: Array<Group>,
		private readonly remainMin: number,
		private remainMax: number
	) {
	}

	// iterative search routine to determine solvability, but not unsolvability
	randomSolve(count: number): { success: boolean; remainMax: number; nrPlays: number } {
		const nFree: Array<number> = [];
		const nMatches: Array<number> = [0, 0, 1, 3, 6];
		const pairings: Array<Array<number>> = [
			[0, 1, 2, 3],
			[1, 0, 3, 2],
			[2, 3, 0, 1],
			[3, 2, 1, 0]
		];

		const initializeGameState = (): void => {
			for (let k = 0; k < this.nGroups; k++) {
				nFree[k] = 0;
				const group = this.tileGroups[k];

				for (let l = 0; l < group.nMembers; l++) {
					if (isPlayable(group.member[l])) {
						nFree[k]++;
					}
				}

				group.pairing = -1;
				group.isPlayed = group.nMembers === 2;
			}
		};

		const findMatchToPlay = (): { groupIndex: number; matchIndex: number } | null => {
			let totalMatches = 0;

			// Check for forced plays
			for (let k = 0; k < this.nGroups; k++) {
				if ((this.tileGroups[k].isPlayed ? 1 : 0) + nMatches[nFree[k]] >= 5) {
					return { groupIndex: k, matchIndex: 0 };
				}
				totalMatches += nMatches[nFree[k]];
			}

			if (totalMatches === 0) {
				return null;
			}

			// Select random match
			let remainingMatches = randBelow(totalMatches);
			let groupIndex = 0;

			while (remainingMatches >= 0) {
				remainingMatches -= nMatches[nFree[groupIndex]];
				if (remainingMatches < 0) {
					break;
				}
				groupIndex++;
			}

			return {
				groupIndex,
				matchIndex: remainingMatches + nMatches[nFree[groupIndex]]
			};
		};

		const playableMembers = (group: Group): Array<number> => {
			const indices: Array<number> = [];
			for (let index = 0; index < group.nMembers; index++) {
				const tile = group.member[index];
				if (tile && !tile.isPlayed && isPlayable(tile)) {
					indices.push(index);
				}
			}
			return indices;
		};

		const findPlayableTiles = (group: Group, matchIndex: number): [number, number] | null => {
			const playable = playableMembers(group);
			let remaining = matchIndex;
			for (let first = 0; first < playable.length; first++) {
				for (let second = first + 1; second < playable.length; second++) {
					if (remaining === 0) {
						return [playable[first], playable[second]];
					}
					remaining--;
				}
			}
			return null;
		};

		const playMatch = (group: Group, tileIndices: [number, number], nTiles: number): number => {
			const [index1, index2] = tileIndices;
			let remainingTiles = nTiles;

			remainingTiles = this.playTile(group.member[index1] as Tile, nFree, remainingTiles);
			remainingTiles = this.playTile(group.member[index2] as Tile, nFree, remainingTiles);

			group.isPlayed = true;
			group.pairing = pairings[index1][index2];
			nFree[this.tileGroups.indexOf(group)] -= 2;

			return remainingTiles;
		};

		const resetState = (): void => {
			for (let k = 0; k < this.nTilesCount; k++) {
				this.tileList[k].isPlayed = false;
			}
			for (let k = 0; k < this.nGroups; k++) {
				this.tileGroups[k].isPlayed = false;
				if (this.tileGroups[k].nMembers === 2) {
					this.tileGroups[k].pairing = 4;
				}
			}
		};

		const handleSolution = (remainingTiles: number): boolean => {
			if (remainingTiles > this.remainMax) {
				return false;
			}

			for (let k = 0; k < this.nGroups; k++) {
				this.tileGroups[k].bestPairing = this.tileGroups[k].pairing;
			}

			this.remainMax = remainingTiles - 2;

			if (this.remainMax < this.remainMin) {
				for (let k = 0; k < this.nGroups; k++) {
					if (this.tileGroups[k].nMembers === 4) {
						this.tileGroups[k].pairing = 0;
					}
				}
				return true;
			}

			return false;
		};

		// Main execution loop
		for (let n = 0; n < count; n++) {
			let remainingTiles = this.nTilesCount;
			initializeGameState();

			let match = findMatchToPlay();
			while (match) {
				const group = this.tileGroups[match.groupIndex];
				const tileIndices = findPlayableTiles(group, match.matchIndex);
				if (tileIndices) {
					remainingTiles = playMatch(group, tileIndices, remainingTiles);
					match = findMatchToPlay();
				} else {
					match = null;
				}
			}

			resetState();
			this.nrPlays++;

			if (handleSolution(remainingTiles)) {
				return { success: true, nrPlays: this.nrPlays, remainMax: this.remainMax };
			}
		}

		// Reset final state
		for (let k = 0; k < this.nGroups; k++) {
			if (this.tileGroups[k].nMembers === 4) {
				this.tileGroups[k].pairing = 0;
			}
		}

		return { success: false, nrPlays: this.nrPlays, remainMax: this.remainMax };
	}

	// play a tile for randomSolve
	private playTile(tile: Tile, freeCount: Array<number>, remainingTiles: number): number {
		// Helper function to update free counts for neighboring tiles
		const updateNeighborCounts = (neighbors: TileNeighboursLeftRight | TileNeighboursAboveBelow, multiplier: number) => {
			for (let index = 0; neighbors[index] !== undefined; index++) {
				const neighbor = neighbors[index];
				if (neighbor && !neighbor.isPlayed) {
					freeCount[neighbor.value] += isPlayable(neighbor) ? multiplier : 0;
				}
			}
		};

		// Decrease counts for left and right neighbors (remove them from free list)
		updateNeighborCounts(tile.left, -1);
		updateNeighborCounts(tile.right, -1);

		// Mark the tile as played and decrease remaining count
		tile.isPlayed = true;
		const updatedRemainingTiles = remainingTiles - 1;

		// Increase counts for left and right neighbors (they might become playable)
		updateNeighborCounts(tile.left, 1);
		updateNeighborCounts(tile.right, 1);

		// Make tiles below this one potentially playable
		updateNeighborCounts(tile.below, 1);

		return updatedRemainingTiles;
	}
}
