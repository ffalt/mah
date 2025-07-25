import type { Group, Tile } from './solver.types';
import { rand } from './solver.tools';

export class SolveInit {
	tileGroups: Array<Group> = []; // [maxGroups]
	qtsIndex: number;
	nGroups: number;

	constructor(
		private readonly tileList: Array<Tile>,
		private readonly lo: Array<Array<Array<Tile | undefined>>>,
		private readonly qts: Array<Group>,
		private readonly maxHeight: number,
		private readonly maxWidth: number,
		private readonly maxDepth: number,
		private readonly maxGroups: number,
		private readonly nTilesCount: number
	) {
	}

	// initializes both randomSolve and sureSolve
	initSolve(): {
		tileGroups: Array<Group>;
		qtsIndex: number;
		nGroups: number;
	} {
		this.initSolve_clearTileNeighbors();
		this.initSolve_computeHorizontalNeighbors();
		this.initSolve_computeVerticalNeighbors();
		this.initSolve_initializeGroups();
		this.initSolve_setupSearchSystem();
		return { tileGroups: this.tileGroups, qtsIndex: this.qtsIndex, nGroups: this.nGroups };
	}

	private initSolve_clearTileNeighbors() {
		for (const tile of this.tileList) {
			// Reset all neighbor arrays
			for (const direction of ['left', 'right', 'above', 'below']) {
				const maxNeighbors = direction === 'above' || direction === 'below' ? 5 : 3;
				for (let index = 0; index < maxNeighbors; index++) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					(tile as any)[direction][index] = undefined;
				}
			}
			tile.isPlayed = false;
		}
	}

	private initSolve_forEachAdjacentPosition(row: number, col: number, callback: (r: number, c: number) => void) {
		for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
			for (let c = Math.max(col - 1, 0); c < Math.min(col + 2, this.maxWidth); c++) {
				callback(r, c);
			}
		}
	}

	private initSolve_linkHorizontalNeighbors(row: number, col: number, lev: number) {
		const rightTile = this.lo[row][col][lev];
		const leftTile = this.lo[row][col - 2][lev];

		if (rightTile) {
			let k = 0;
			for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
				if (this.lo[r][col - 2][lev]) {
					rightTile.left[k++] = this.lo[r][col - 2][lev];
				}
			}
		}

		if (leftTile) {
			let k = 0;
			for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
				if (this.lo[r][col][lev]) {
					leftTile.right[k++] = this.lo[r][col][lev];
				}
			}
		}
	};

	private initSolve_computeHorizontalNeighbors() {
		for (let row = 0; row < this.maxHeight; row++) {
			for (let col = 2; col < this.maxWidth; col++) {
				for (let lev = 0; lev < this.maxDepth; lev++) {
					this.initSolve_linkHorizontalNeighbors(row, col, lev);
				}
			}
		}
	};

	private initSolve_linkVerticalNeighbors(row: number, col: number, lev: number) {
		const lowerTile = this.lo[row][col][lev - 1];
		const upperTile = this.lo[row][col][lev];

		if (lowerTile) {
			let k = 0;
			this.initSolve_forEachAdjacentPosition(row, col, (r, c) => {
				if (this.lo[r][c][lev]) {
					lowerTile.above[k++] = this.lo[r][c][lev];
				}
			});
		}

		if (upperTile) {
			let k = 0;
			this.initSolve_forEachAdjacentPosition(row, col, (r, c) => {
				if (this.lo[r][c][lev - 1]) {
					upperTile.below[k++] = this.lo[r][c][lev - 1];
				}
			});
		}
	}

	private initSolve_computeVerticalNeighbors() {
		for (let row = 0; row < this.maxHeight; row++) {
			for (let col = 0; col < this.maxWidth; col++) {
				for (let lev = 1; lev < this.maxDepth; lev++) {
					this.initSolve_linkVerticalNeighbors(row, col, lev);
				}
			}
		}
	}

	private initSolve_initializeGroups() {
		// Clear groups
		this.tileGroups = [];
		for (let k = 0; k < this.maxGroups; k++) {
			this.tileGroups.push({
				pairing: -1,
				bestPairing: -1,
				nMembers: 0,
				member: [undefined, undefined, undefined, undefined],
				isPlayed: false,
				rotation: 0
			});
		}

		// Collect groups
		for (let k = 0; k < this.nTilesCount; k++) {
			const v = this.tileList[k].value;
			this.tileGroups[v].member[this.tileGroups[v].nMembers] = this.tileList[k];
			this.tileGroups[v].nMembers++;
		}
	}

	private initSolve_setupSearchSystem() {
		let insertIndex = 0;
		let maxGroupIndex = 0;

		// First add groups with exactly 2 members
		for (let k = 0; k < this.maxGroups; k++) {
			const group = this.tileGroups[k];
			if (group.nMembers === 2) {
				this.qts[insertIndex] = group;
				this.qts[insertIndex].pairing = 4;
				insertIndex++;
			}
			if (group.nMembers !== 0) {
				maxGroupIndex = k;
			}
		}

		// Add empty groups
		for (let k = 0; k <= maxGroupIndex; k++) {
			const group = this.tileGroups[k];
			if (group.nMembers === 0) {
				this.qts[insertIndex] = group;
				this.qts[insertIndex].pairing = -1;
				insertIndex++;
			}
		}

		this.qtsIndex = insertIndex;

		// Add groups with 4 members and randomize their positions
		for (let k = 0; k <= maxGroupIndex; k++) {
			const group = this.tileGroups[k];
			if (group.nMembers === 4) {
				this.qts[insertIndex] = group;
				this.qts[insertIndex].pairing = 0;

				// Swap with a random position
				const randomIndex = this.qtsIndex + (rand() % (insertIndex + 1 - this.qtsIndex));
				const temporary = this.qts[insertIndex];
				this.qts[insertIndex] = this.qts[randomIndex];
				this.qts[randomIndex] = temporary;

				insertIndex++;
			}
		}

		this.nGroups = insertIndex;
	}
}
