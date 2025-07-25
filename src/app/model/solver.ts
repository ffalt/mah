import type { StonePosition } from './stone';
import type { Place } from './types';

/*
	MIT

	Solitaire Mahjongg solver
	from mjsolver.cpp
	https://www.math.ru.nl/~debondt/mjsolver.html

	Copyright (c) 2007 Michiel de Bondt
	ported to typescript & adapted by ffalt

	Permission is hereby granted, free of charge, to any person obtaining a
	copy of this software and associated documentation files (the "Software"),
	to deal in the Software without restriction, including without limitation
	the rights to use, copy, modify, merge, publish, distribute, sublicense,
	and/or sell copies of the Software, and to permit persons to whom the
	Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
		FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
	THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
	DEALINGS IN THE SOFTWARE.
 */

type TileNeighboursLeftRight = [Tile | undefined, Tile | undefined, Tile | undefined];
type TileNeighboursAboveBelow = [Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined];

interface Tile {
	// undefined-terminated arrays of neighbo(u)rs
	left: TileNeighboursLeftRight;
	right: TileNeighboursLeftRight;
	above: TileNeighboursAboveBelow;
	below: TileNeighboursAboveBelow;
	// The group of the tile (0-35)
	value: number;
	// If the tile has been played already by the solver during the routine prune()
	isPlayed: boolean;
}

// computes if the solver can play a tile
function isPlayable(t?: Tile): boolean {
	if (!t) {
		return false;
	}
	let k = 0;
	// checks if there are no above neighbo(u)rs
	let above = t.above[k];
	while (above !== undefined) {
		if (!above.isPlayed) {
			return false;
		}
		k++;
		above = t.above[k];
	}
	k = 0;
	let left = t.left[k];
	// checks if there are no left neighbo(u)rs
	while (left !== undefined) {
		if (!left.isPlayed) {
			k = 0;
			// checks if there are no right neighbo(u)rs
			let right = t.right[k];
			while (right !== undefined) {
				if (!right.isPlayed) {
					return false;
				}
				k++;
				right = t.right[k];
			}
			return true;
		}
		k++;
		left = t.left[k];
	}
	return true;
}

function rand(): number {
	return Math.floor(Math.random() * 100);
}

function int(index: number): number {
	return Math.floor(index);
}

interface Group {
	// the pairing of the four tiles (0-5): see prune() for more info
	pairing: number;
	// number of tiles with the value of this group
	nMembers: number;
	// array of tiles of this group
	member: [Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined];
	// whether all tiles are already played
	isPlayed: boolean;
	// the pairing for the best partial solution found this far
	bestPairing: number;
	// how often the last three tiles are cycled
	rotation: number;
}

class SolverWriter {
	nTiles1: number;
	nTiles2: number;
	result: Array<Place> = [];

	constructor(nTilesCount: number,
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
		if (qtmA && qtmB && !(qtmA.isPlayed) && isPlayable(qtmA) && isPlayable(qtmB)) {
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

export class Solver {
	// number of tiles
	nTilesCount: number;
	// number of "game simulations" of randomSolve and sureSolve
	nPlays: number;
	nrPlays: number;
	// tile array;
	tl: Array<Tile> = []; // [4 * maxGroups]
	// group array, indexed by group value
	qt: Array<Group> = []; // [maxGroups]
	// pointers of grid positions to tile array, to describe layout
	lo: Array<Array<Array<Tile | undefined>>> = []; // [maxHeight][maxWidth][maxDepth]
	// array of pointers to groups, indexes in order of search path
	qts: Array<Group> = []; // [maxGroups]
	// start index and bottom index of search path
	qtsIndex: number;
	nGroups: number;
	// search interval for the number of tiles that remains finally
	remainMax: number;
	remainMin: number;
	// for aborting the solver
	aborted: boolean;

	maxGroups: number = 80;
	maxHeight: number = 40;
	maxWidth: number = 100;
	maxDepth: number = 10;

	solveLayout(stones: Array<StonePosition>): number {
		// clear layout pointers
		for (let row = 0; row < this.maxHeight; row++) {
			this.lo[row] = [];
			for (let col = 0; col < this.maxWidth; col++) {
				this.lo[row][col] = [];
				for (let lev = 0; lev < this.maxDepth; lev++) {
					this.lo[row][col][lev] = undefined;
				}
			}
		}
		for (const stone of stones) {
			const t: Tile = {
				left: [undefined, undefined, undefined],
				right: [undefined, undefined, undefined],
				above: [undefined, undefined, undefined, undefined, undefined],
				below: [undefined, undefined, undefined, undefined, undefined],
				value: stone.groupNr,
				// If the solver has played the tile already during the routine prune()
				isPlayed: false
			};
			this.lo[stone.y][stone.x][stone.z] = t;
			this.tl.push(t);
		}

		this.nTilesCount = stones.length;
		return this.solve(0, 0);
	}

	writeGame(): Array<Place> {
		this.unrotateGroups();
		const writer = new SolverWriter(this.nTilesCount, this.qt, this.lo, this.nGroups, this.maxHeight, this.maxWidth, this.maxDepth);
		return writer.write();
	}

	// play a tile for randomSolve
	private static playTile(tile: Tile, freeCount: Array<number>, remainingTiles: number): number {
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

	// initializes both randomSolve and sureSolve
	private initSolve(): void {
		// Define all helper functions as subfunctions
		const clearTileNeighbors = () => {
			for (const tile of this.tl) {
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
		};

		const forEachAdjacentPosition = (row: number, col: number, callback: (r: number, c: number) => void) => {
			for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
				for (let c = Math.max(col - 1, 0); c < Math.min(col + 2, this.maxWidth); c++) {
					callback(r, c);
				}
			}
		};

		const linkHorizontalNeighbors = (row: number, col: number, lev: number) => {
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

		const computeHorizontalNeighbors = () => {
			for (let row = 0; row < this.maxHeight; row++) {
				for (let col = 2; col < this.maxWidth; col++) {
					for (let lev = 0; lev < this.maxDepth; lev++) {
						linkHorizontalNeighbors(row, col, lev);
					}
				}
			}
		};

		const linkVerticalNeighbors = (row: number, col: number, lev: number) => {
			const lowerTile = this.lo[row][col][lev - 1];
			const upperTile = this.lo[row][col][lev];

			if (lowerTile) {
				let k = 0;
				forEachAdjacentPosition(row, col, (r, c) => {
					if (this.lo[r][c][lev]) {
						lowerTile.above[k++] = this.lo[r][c][lev];
					}
				});
			}

			if (upperTile) {
				let k = 0;
				forEachAdjacentPosition(row, col, (r, c) => {
					if (this.lo[r][c][lev - 1]) {
						upperTile.below[k++] = this.lo[r][c][lev - 1];
					}
				});
			}
		};

		const computeVerticalNeighbors = () => {
			for (let row = 0; row < this.maxHeight; row++) {
				for (let col = 0; col < this.maxWidth; col++) {
					for (let lev = 1; lev < this.maxDepth; lev++) {
						linkVerticalNeighbors(row, col, lev);
					}
				}
			}
		};

		const initializeGroups = () => {
			// Clear groups
			this.qt = [];
			for (let k = 0; k < this.maxGroups; k++) {
				this.qt.push({
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
				const v = this.tl[k].value;
				this.qt[v].member[this.qt[v].nMembers] = this.tl[k];
				this.qt[v].nMembers++;
			}
		};

		const setupSearchSystem = () => {
			let insertIndex = 0;
			let maxGroupIndex = 0;

			// First add groups with exactly 2 members
			for (let k = 0; k < this.maxGroups; k++) {
				const group = this.qt[k];
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
				const group = this.qt[k];
				if (group.nMembers === 0) {
					this.qts[insertIndex] = group;
					this.qts[insertIndex].pairing = -1;
					insertIndex++;
				}
			}

			this.qtsIndex = insertIndex;

			// Add groups with 4 members and randomize their positions
			for (let k = 0; k <= maxGroupIndex; k++) {
				const group = this.qt[k];
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
			this.aborted = false;
		};

		// Execute the subfunctions in sequence
		clearTileNeighbors();
		computeHorizontalNeighbors();
		computeVerticalNeighbors();
		initializeGroups();
		setupSearchSystem();
	}

	// test solvability with the given pairing of all tiles
	private prune(): number {
		let currentTiles = this.nTilesCount;
		let previousTiles = this.nTilesCount;
		this.nPlays++;

		const play = (t1: Tile, t2: Tile): void => {
			t1.isPlayed = true;
			t2.isPlayed = true;
			currentTiles -= 2;
		};

		const checkFree = (t: Tile): void => {
			if (!t.isPlayed && isPlayable(t)) {
				t.isPlayed = true;
				previousTiles++;
			}
		};

		const handleFreeGroup = (group: Group, tiles: Array<Tile>): void => {
			const [t0, t1, t2, t3] = tiles;

			if (t0.isPlayed || t1.isPlayed || t2.isPlayed) {
				for (const t of tiles) checkFree(t);
				if (tiles.every(t => t.isPlayed)) {
					group.isPlayed = true;
					currentTiles -= 2;
				}
				return;
			}

			const tryPlayWith = (tile: Tile, partners: Array<Tile>): boolean => {
				if (!tile.isPlayed && isPlayable(tile)) {
					for (const partner of partners) {
						if (!partner.isPlayed && isPlayable(partner)) {
							play(tile, partner);
							return true;
						}
					}
				}
				return false;
			};

			tryPlayWith(t0, [t1, t2, t3]) ||
			tryPlayWith(t1, [t2, t3]) ||
			tryPlayWith(t2, [t3]);
		};

		const handlePairedGroup = (t1: Tile, t2: Tile, dependentTile: Tile, group: Group): void => {
			if (!t1.isPlayed && isPlayable(t1) && isPlayable(t2)) {
				play(t1, t2);
				group.isPlayed = dependentTile.isPlayed;
			}
		};

		const processGroup = (group: Group): void => {
			if (group.isPlayed) return;

			const tiles = group.member as Array<Tile>;
			const [t0, t1, t2, t3] = tiles;

			// eslint-disable-next-line default-case
			switch (group.pairing) {
				case 0: { // free group
					handleFreeGroup(group, tiles);
					break;
				}

				case 1: { // pairing 0-1, 2-3
					handlePairedGroup(t0, t1, t2, group);
					handlePairedGroup(t2, t3, t0, group);
					break;
				}

				case 2: { // pairing 0-2, 1-3
					handlePairedGroup(t0, t2, t1, group);
					handlePairedGroup(t1, t3, t0, group);
					break;
				}

				case 3: { // pairing 0-3, 1-2
					handlePairedGroup(t0, t3, t1, group);
					handlePairedGroup(t1, t2, t0, group);
					break;
				}

				case 4: { // half group, pairing 0-1
					if (isPlayable(t0) && isPlayable(t1)) {
						play(t0, t1);
						group.isPlayed = true;
					}
					break;
				}

				case 5: { // all four simultaneously
					if (tiles.every(tile => isPlayable(tile))) {
						play(t0, t1);
						play(t2, t3);
						group.isPlayed = true;
					}
					break;
				}
			}
		};

		const resetState = (): void => {
			for (let k = 0; k < this.nTilesCount; k++) {
				this.tl[k].isPlayed = false;
			}
			for (let k = 0; k < this.nGroups; k++) {
				this.qt[k].isPlayed = false;
			}
		};

		// Main pruning loop
		do {
			previousTiles = currentTiles;

			for (let k = 0; k < this.nGroups; k++) {
				processGroup(this.qt[k]);
			}
		} while (currentTiles !== previousTiles);

		resetState();
		return currentTiles;
	}

	// stores the solution found
	private unrotateGroups(): void {
		for (let index = 0; index < this.nGroups; index++) {
			switch (this.qt[index].rotation) {
				case 1: {
					const t: Tile | undefined = this.qt[index].member[1];
					this.qt[index].member[1] = this.qt[index].member[2];
					this.qt[index].member[2] = this.qt[index].member[3];
					this.qt[index].member[3] = t;
					break;
				}
				case 2: {
					const t: Tile | undefined = this.qt[index].member[3];
					this.qt[index].member[3] = this.qt[index].member[2];
					this.qt[index].member[2] = this.qt[index].member[1];
					this.qt[index].member[1] = t;
					break;
				}
				default: {
					break;
				}
			}
			this.qt[index].rotation = 0;
		}
	}

	// recursive search routine to determine (un)solvability improves speed by changing search order backwards
	private sureSolve(startIndex: number): boolean {
		const checkInitialPrune = (): boolean => this.prune() > this.remainMax;

		const findPrunePoint = (start: number): number => {
			for (let k = start; k < this.nGroups; k++) {
				this.qts[k].pairing = 1;
				if (this.prune() > this.remainMax) {
					return k;
				}
			}
			return this.nGroups;
		};

		const handleSolutionFound = (): boolean => {
			// Save best pairings
			for (let index = 0; index < this.nGroups; index++) {
				this.qt[index].bestPairing = this.qt[index].pairing;
			}

			// Adjust rotations
			for (let index = this.qtsIndex; index < this.nGroups; index++) {
				this.qts[index].bestPairing += 3 - this.qts[index].rotation;
				if (this.qts[index].bestPairing > 3) {
					this.qts[index].bestPairing -= 3;
				}
			}

			this.remainMax = this.prune() - 2;

			if (this.remainMax < this.remainMin) {
				for (let index = this.qtsIndex; index < this.nGroups; index++) {
					this.qts[index].pairing = 0;
				}
				return true;
			}

			// Reset and search for better solution
			for (let k = startIndex; k < this.nGroups; k++) {
				this.qts[k].pairing = 0;
			}
			return this.sureSolve(startIndex);
		};

		const rotateTiles = (groupIndex: number, clockwise: boolean): void => {
			const group = this.qts[groupIndex];
			if (clockwise) {
				const temporary = group.member[3];
				group.member[3] = group.member[2];
				group.member[2] = group.member[1];
				group.member[1] = temporary;
				group.rotation = (group.rotation + 1) % 3;
			} else {
				const temporary = group.member[1];
				group.member[1] = group.member[2];
				group.member[2] = group.member[3];
				group.member[3] = temporary;
				group.rotation = (group.rotation + 2) % 3;
			}
		};

		const identifyRequiredNodes = (prunePoint: number): number => {
			const requiredNodes: Array<Group> = [this.qts[prunePoint]];
			let nodeCount = 1;
			let currentPoint = prunePoint;

			for (let index = prunePoint - 1; index >= startIndex; index--) {
				this.qts[index].pairing = 0;

				if (this.prune() <= this.remainMax) {
					// Node is required
					this.qts[index].pairing = 1;
					requiredNodes[nodeCount++] = this.qts[index];
				} else {
					// Rotate and remove node
					rotateTiles(index, rand() % 2 === 0);
					this.qts[currentPoint] = this.qts[index];
					currentPoint--;
				}
			}

			// Restore required nodes
			for (let index = currentPoint; index >= startIndex; index--) {
				this.qts[index] = requiredNodes[--nodeCount];
			}

			return currentPoint;
		};

		const tryAdvancedPairings = (prunePoint: number): boolean => {
			for (let index = prunePoint; index >= startIndex; index--) {
				this.qts[index].pairing = 2;
				if (this.sureSolve(index + 1)) return true;

				this.qts[index].pairing = 3;
				if (this.sureSolve(index + 1)) return true;

				this.qts[index].pairing = 0;
			}
			return false;
		};

		// Main execution flow
		if (checkInitialPrune()) return false;

		const prunePoint = findPrunePoint(startIndex);

		if (prunePoint === this.nGroups) {
			return handleSolutionFound();
		}

		const finalPrunePoint = identifyRequiredNodes(prunePoint);
		return tryAdvancedPairings(finalPrunePoint);
	}

	// iterative search routine to determine solvability, but not unsolvability
	private randomSolve(count: number): boolean {
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
				const group = this.qt[k];

				for (let l = 0; l < group.nMembers; l++) {
					if (isPlayable(group.member[l])) {
						nFree[k]++;
					}
				}

				group.pairing = -1;
				group.isPlayed = group.nMembers === 2;
			}
		};

		const findMatchToPlay = (): { groupIndex: number, matchIndex: number } | null => {
			let totalMatches = 0;

			// Check for forced plays
			for (let k = 0; k < this.nGroups; k++) {
				if ((this.qt[k].isPlayed ? 1 : 0) + nMatches[nFree[k]] >= 5) {
					return { groupIndex: k, matchIndex: 0 };
				}
				totalMatches += nMatches[nFree[k]];
			}

			if (totalMatches === 0) return null;

			// Select random match
			let remainingMatches = rand() % totalMatches;
			let groupIndex = 0;

			while (remainingMatches >= 0) {
				remainingMatches -= nMatches[nFree[groupIndex]];
				if (remainingMatches < 0) break;
				groupIndex++;
			}

			return {
				groupIndex,
				matchIndex: remainingMatches + nMatches[nFree[groupIndex]]
			};
		};

		const findPlayableTiles = (group: Group, matchIndex: number): [number, number] => {
			let firstIndex = 0;
			let secondIndex = group.nMembers - 1;

			const findNextPlayable = (index: number, increment: number): number => {
				let result = index;
				while (true) {
					const tile = group.member[result] as Tile;
					if (!tile.isPlayed && isPlayable(tile)) {
						break;
					}
					result += increment;
				}
				return result;
			};

			if (matchIndex <= 1) {
				firstIndex = findNextPlayable(firstIndex, 1);
				if (matchIndex === 0) {
					secondIndex = findNextPlayable(firstIndex + 1, 1);
				}
			}

			if (matchIndex >= 1) {
				secondIndex = findNextPlayable(secondIndex, -1);
				if (matchIndex === 2) {
					firstIndex = findNextPlayable(secondIndex - 1, -1);
				}
			}

			return [firstIndex, secondIndex];
		};

		const playMatch = (group: Group, tileIndices: [number, number], nTiles: number): number => {
			const [index1, index2] = tileIndices;
			let remainingTiles = nTiles;

			remainingTiles = Solver.playTile(group.member[index1] as Tile, nFree, remainingTiles);
			remainingTiles = Solver.playTile(group.member[index2] as Tile, nFree, remainingTiles);

			group.isPlayed = true;
			group.pairing = pairings[index1][index2];
			nFree[this.qt.indexOf(group)] -= 2;

			return remainingTiles;
		};

		const resetState = (): void => {
			for (let k = 0; k < this.nTilesCount; k++) {
				this.tl[k].isPlayed = false;
			}
			for (let k = 0; k < this.nGroups; k++) {
				this.qt[k].isPlayed = false;
				if (this.qt[k].nMembers === 2) {
					this.qt[k].pairing = 4;
				}
			}
		};

		const handleSolution = (remainingTiles: number): boolean => {
			if (remainingTiles > this.remainMax) return false;

			for (let k = 0; k < this.nGroups; k++) {
				this.qt[k].bestPairing = this.qt[k].pairing;
			}

			this.remainMax = remainingTiles - 2;

			if (this.remainMax < this.remainMin) {
				for (let k = 0; k < this.nGroups; k++) {
					if (this.qt[k].nMembers === 4) {
						this.qt[k].pairing = 0;
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

			while (true) {
				const match = findMatchToPlay();
				if (!match) break;

				const group = this.qt[match.groupIndex];
				const tileIndices = findPlayableTiles(group, match.matchIndex);
				remainingTiles = playMatch(group, tileIndices, remainingTiles);
			}

			resetState();
			this.nrPlays++;

			if (handleSolution(remainingTiles)) {
				return true;
			}
		}

		// Reset final state
		for (let k = 0; k < this.nGroups; k++) {
			if (this.qt[k].nMembers === 4) {
				this.qt[k].pairing = 0;
			}
		}

		return false;
	}

	private solve(remain1: number, remain2: number): number {
		this.initSolve();
		this.nrPlays = 0;
		this.nPlays = 0;
		this.remainMax = Math.max(remain1, remain2);
		this.remainMin = Math.min(remain1, remain2);
		if (this.prune() > this.remainMax) {
			return this.remainMax + 2;
		}
		if (this.randomSolve(int(1.2 ** (this.nGroups - this.qtsIndex)))) {
			return this.remainMax + 2;
		}
		this.sureSolve(this.qtsIndex);
		this.unrotateGroups();
		return this.remainMax + 2;
	}

}
