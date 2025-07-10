import { StonePosition } from './stone';
import { Place } from './types';

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

interface Tile {
	// undefined-terminated arrays of neighbo(u)rs
	left: [Tile | undefined, Tile | undefined, Tile | undefined];
	right: [Tile | undefined, Tile | undefined, Tile | undefined];
	above: [Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined];
	below: [Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined, Tile | undefined];
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

function int(i: number): number {
	return Math.floor(i);
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
			case 1: // pairing 0-1, 2-3
				if (this.writePairing(k, qtk, 0, 1)) {
					const qtm2 = qtk.member[2] as Tile;
					qtk.isPlayed = qtm2.isPlayed;
				}
				this.writePairing(k, qtk, 2, 3);
				break;
			case 2: // pairing 0-2, 1-3
				this.writePairing(k, qtk, 0, 2);
				this.writePairing(k, qtk, 1, 3);
				break;
			case 3: // pairing 0-3, 1-2
				this.writePairing(k, qtk, 0, 3);
				this.writePairing(k, qtk, 1, 2);
				break;
			case 4: // half a group, pairing 0-1
				this.writePairing(k, qtk, 0, 1);
				break;
			default:
				break;
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
		stones.forEach(stone => {
			const t: Tile = {
				left: [undefined, undefined, undefined],
				right: [undefined, undefined, undefined],
				above: [undefined, undefined, undefined, undefined, undefined],
				below: [undefined, undefined, undefined, undefined, undefined],
				value: stone.groupnr,
				// If the solver has played the tile already during the routine prune()
				isPlayed: false
			};
			this.lo[stone.y][stone.x][stone.z] = t;
			this.tl.push(t);
		});

		this.nTilesCount = stones.length;
		return this.solve(0, 0);
	}

	writeGame(): Array<Place> {
		this.unrotateGroups();
		const writer = new SolverWriter(this.nTilesCount, this.qt, this.lo, this.nGroups, this.maxHeight, this.maxWidth, this.maxDepth);
		return writer.write();
	}

	// play a tile for randomSolve
	private static playTile(t: Tile, nFree: Array<number>, nTiles2: number): number {
		let nTiles3 = nTiles2;
		for (let i = 0; t.left[i] !== undefined; i++) {
			const tLeft = t.left[i] as Tile;
			if (!tLeft.isPlayed) {
				nFree[tLeft.value] -= isPlayable(tLeft) ? 1 : 0;
			}
		}
		for (let i = 0; t.right[i] !== undefined; i++) {
			const tRight = t.right[i] as Tile;
			if (!tRight.isPlayed) {
				nFree[tRight.value] -= isPlayable(tRight) ? 1 : 0;
			}
		}
		t.isPlayed = true;
		nTiles3--;
		for (let i = 0; t.left[i] !== undefined; i++) {
			const tLeft = t.left[i] as Tile;
			if (!tLeft.isPlayed) {
				nFree[tLeft.value] += isPlayable(tLeft) ? 1 : 0;
			}
		}
		for (let i = 0; t.right[i] !== undefined; i++) {
			const tRight = t.right[i] as Tile;
			if (!tRight.isPlayed) {
				nFree[tRight.value] += isPlayable(tRight) ? 1 : 0;
			}
		}
		for (let i = 0; t.below[i] !== undefined; i++) {
			const tBelow = t.below[i] as Tile;
			nFree[tBelow.value] += isPlayable(tBelow) ? 1 : 0;
		}
		return nTiles3;
	}

	// initializes both randomSolve and sureSolve
	// eslint-disable-next-line complexity
	private initSolve(): void {
		// clear tile neighbours
		this.tl.forEach(tlk => {
			tlk.left[0] = undefined;
			tlk.left[1] = undefined;
			tlk.left[2] = undefined;
			tlk.right[0] = undefined;
			tlk.right[1] = undefined;
			tlk.right[2] = undefined;
			tlk.above[0] = undefined;
			tlk.above[1] = undefined;
			tlk.above[2] = undefined;
			tlk.above[3] = undefined;
			tlk.above[4] = undefined;
			tlk.below[0] = undefined;
			tlk.below[1] = undefined;
			tlk.below[2] = undefined;
			tlk.below[3] = undefined;
			tlk.below[4] = undefined;
			tlk.isPlayed = false;
		});
		// compute left and right neighbours
		for (let row = 0; row < this.maxHeight; row++) {
			for (let col = 2; col < this.maxWidth; col++) {
				for (let lev = 0; lev < this.maxDepth; lev++) {
					const tile = this.lo[row][col][lev];
					if (tile !== undefined) {
						let k = 0;
						for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
							if (this.lo[r][col - 2][lev] !== undefined) {
								tile.left[k] = this.lo[r][col - 2][lev];
								k++;
							}
						}
					}
					const tile2 = this.lo[row][col - 2][lev];
					if (tile2 !== undefined) {
						let k = 0;
						for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
							if (this.lo[r][col][lev] !== undefined) {
								tile2.right[k] = this.lo[r][col][lev];
								k++;
							}
						}
					}
				}
			}
		}
		// compute above and below neighbours
		for (let row = 0; row < this.maxHeight; row++) {
			for (let col = 0; col < this.maxWidth; col++) {
				for (let lev = 1; lev < this.maxDepth; lev++) {
					const tile = this.lo[row][col][lev - 1];
					if (tile !== undefined) {
						let k = 0;
						for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
							for (let c = Math.max(col - 1, 0); c < Math.min(col + 2, this.maxWidth); c++) {
								if (this.lo[r][c][lev] !== undefined) {
									tile.above[k] = this.lo[r][c][lev];
									k++;
								}
							}
						}
					}
					const tile1 = this.lo[row][col][lev];
					if (tile1 !== undefined) {
						let k = 0;
						for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxHeight); r++) {
							for (let c = Math.max(col - 1, 0); c < Math.min(col + 2, this.maxWidth); c++) {
								if (this.lo[r][c][lev - 1] !== undefined) {
									tile1.below[k] = this.lo[r][c][lev - 1];
									k++;
								}
							}
						}
					}
				}
			}
		}
		// clear groups
		this.qt = [];
		for (let k = 0; k < this.maxGroups; k++) {
			const qtk: Group = {
				pairing: -1,
				bestPairing: -1,
				nMembers: 0,
				member: [undefined, undefined, undefined, undefined],
				isPlayed: false,
				rotation: 0
			};
			this.qt.push(qtk);
		}
		// collect groups
		for (let k = 0; k < this.nTilesCount; k++) {
			const v = this.tl[k].value;
			this.qt[v].member[this.qt[v].nMembers] = this.tl[k];
			this.qt[v].nMembers++;
		}
		// initialize search system of sureSolve
		let l = 0;
		let lq = 0;
		for (let k = 0; k < this.maxGroups; k++) {
			const gtk = this.qt[k];
			if (gtk.nMembers === 2) {
				this.qts[l] = gtk;
				this.qts[l].pairing = 4;
				l++;
			}
			if (gtk.nMembers !== 0) {
				lq = k;
			}
		}
		for (let k = 0; k <= lq; k++) {
			const gtk = this.qt[k];
			if (gtk.nMembers === 0) {
				this.qts[l] = gtk;
				this.qts[l].pairing = -1;
				l++;
			}
		}
		this.qtsIndex = l;
		for (let k = 0; k <= lq; k++) {
			const gtk = this.qt[k];
			if (gtk.nMembers === 4) {
				this.qts[l] = gtk;
				this.qts[l].pairing = 0;
				const d: Group = this.qts[l];
				const r = rand() % (l + 1 - this.qtsIndex);
				this.qts[l] = this.qts[this.qtsIndex + r];
				this.qts[this.qtsIndex + r] = d;
				l++;
			}
		}
		this.nGroups = l;
		this.aborted = false;
	}

	// test solvability with the given pairing of all tiles
	// eslint-disable-next-line complexity
	private prune(): number {
		let nTiles1 = this.nTilesCount;
		let nTiles2 = this.nTilesCount;
		this.nPlays++;
		// play until no tiles can be removed anymore
		do {
			nTiles1 = nTiles2;
			for (let k = 0; k < this.nGroups; k++) {
				const qtk = this.qt[k];
				if (!qtk.isPlayed) {
					const qtk0 = qtk.member[0] as Tile;
					const qtk1 = qtk.member[1] as Tile;
					const qtk2 = qtk.member[2] as Tile;
					const qtk3 = qtk.member[3] as Tile;
					const play = (t1: Tile, t2: Tile) => {
						t1.isPlayed = true;
						t2.isPlayed = true;
						nTiles2 -= 2;
					};
					const check_free = (t: Tile) => {
						if (!(t.isPlayed) && isPlayable(t)) {
							t.isPlayed = true;
							nTiles1++;
						}
					};
					const check_pair = (t1: Tile, t2: Tile, t3: Tile) => {
						if (!t1.isPlayed && isPlayable(t1) && isPlayable(t2)) {
							play(t1, t2);
							qtk.isPlayed = t3.isPlayed;
						}
					};
					switch (qtk.pairing) {
						case 0: { // free group, no pairing
							// first two played together,
							// last two played separate
							if (qtk0.isPlayed || qtk1.isPlayed || qtk2.isPlayed) {
								qtk.member.forEach(t => check_free(t as Tile));
								if (qtk0.isPlayed && qtk1.isPlayed && qtk2.isPlayed && qtk3.isPlayed) {
									qtk.isPlayed = true;
									nTiles2 -= 2;
								}
							} else {
								if (!qtk0.isPlayed && isPlayable(qtk0)) {
									if (!qtk1.isPlayed && isPlayable(qtk1)) {
										play(qtk0, qtk1);
									} else if (!qtk2.isPlayed && isPlayable(qtk2)) {
										play(qtk0, qtk2);
									} else if (!(qtk3.isPlayed) && isPlayable(qtk3)) {
										play(qtk0, qtk3);
									}
								} else if (!qtk1.isPlayed && isPlayable(qtk1)) {
									if (!qtk2.isPlayed && isPlayable(qtk2)) {
										play(qtk1, qtk2);
									} else if (!qtk3.isPlayed && isPlayable(qtk.member[3])) {
										play(qtk1, qtk3);
									}
								} else if (!qtk2.isPlayed && isPlayable(qtk2)) {
									if (!qtk3.isPlayed && isPlayable(qtk3)) {
										play(qtk2, qtk3);
									}
								}
							}
							break;
						}
						case 1: {// pairing 0-1, 2-3
							check_pair(qtk0, qtk1, qtk2);
							check_pair(qtk2, qtk3, qtk0);
							break;
						}
						case 2: {// pairing 0-2, 1-3
							check_pair(qtk0, qtk2, qtk1);
							check_pair(qtk1, qtk3, qtk0);
							break;
						}
						case 3: {// pairing 0-3, 1-2
							check_pair(qtk0, qtk3, qtk1);
							check_pair(qtk1, qtk2, qtk0);
							break;
						}
						case 4: {// half a group, pairing 0-1
							if (isPlayable(qtk0) && isPlayable(qtk1)) {
								play(qtk0, qtk1);
								qtk.isPlayed = true;
							}
							break;
						}
						case 5: {// all four removed simultaneously
							// for heuristic to smell blockades
							if (isPlayable(qtk0) && isPlayable(qtk1) && isPlayable(qtk2) && isPlayable(qtk3)) {
								play(qtk0, qtk1);
								play(qtk2, qtk3);
								qtk.isPlayed = true;
							}
							break;
						}
						default:
							break;
					}
				}
			}
		} while (nTiles2 !== nTiles1);
		// unplay all played tiles
		for (let k = 0; k < this.nTilesCount; k++) {
			this.tl[k].isPlayed = false;
		}
		for (let k = 0; k < this.nGroups; k++) {
			this.qt[k].isPlayed = false;
		}
		// test if all tiles were removed
		return nTiles2;
	}

	// stores the solution found
	private unrotateGroups(): void {
		for (let i = 0; i < this.nGroups; i++) {
			switch (this.qt[i].rotation) {
				case 1: {
					const t: Tile | undefined = this.qt[i].member[1];
					this.qt[i].member[1] = this.qt[i].member[2];
					this.qt[i].member[2] = this.qt[i].member[3];
					this.qt[i].member[3] = t;
					break;
				}
				case 2: {
					const t: Tile | undefined = this.qt[i].member[3];
					this.qt[i].member[3] = this.qt[i].member[2];
					this.qt[i].member[2] = this.qt[i].member[1];
					this.qt[i].member[1] = t;
					break;
				}
				default:
					break;
			}
			this.qt[i].rotation = 0;
		}
	}

	// recursive search routine to determine (un)solvability improves speed by changing search order backwards
	private sureSolve(si: number): boolean {
		const qts2: Array<Group> = []; // [maxGroups]
		// test whether the current branch might still lead to a solution
		if (this.prune() > this.remainMax) {
			return false;
		}
		let k;
		// descent left in search tree until on bottom or having found a prune
		for (k = si; k < this.nGroups; k++) {
			this.qts[k].pairing = 1;
			// test whether a prune is found
			if (this.prune() > this.remainMax) {
				break;
			}
		}
		// test whether on bottom of search tree
		if (k === this.nGroups) {
			// solution found
			for (let i = 0; i < this.nGroups; i++) {
				this.qt[i].bestPairing = this.qt[i].pairing;
			}
			for (let i = this.qtsIndex; i < this.nGroups; i++) {
				this.qts[i].bestPairing += 3 - this.qts[i].rotation;
				if (this.qts[i].bestPairing > 3) {
					this.qts[i].bestPairing -= 3;
				}
			}
			// redefine remain_max such that next solutions will be better
			this.remainMax = this.prune() - 2;
			if (this.remainMax < this.remainMin) {
				// no need to search further: remain_min tiles remaining is good enough
				for (let i = this.qtsIndex; i < this.nGroups; i++) {
					this.qts[i].pairing = 0;
				}
				return true;
			}
				// search for better solution: redo suresolve with smaller remain_max
				for (k = si; k < this.nGroups; k++) {
					this.qts[k].pairing = 0;
				}
				return this.sureSolve(si);
		}
		// prune found
		let l = 0;
		qts2[l++] = this.qts[k];
		// test which nodes in the interval [si..this.ngroups-1] had a pairing that
		// was required for prune
		for (let i = k - 1; i >= si; i--) {
			this.qts[i].pairing = 0;
			if (this.prune() <= this.remainMax) {
				// pairing of node required for prune
				this.qts[i].pairing = 1;
				qts2[l++] = this.qts[i];
			} else {
				// pairing of node not required for prune
				// shake (rotate) node in order to get a prune from it later
				if (rand() % 2) {
					const t: Tile | undefined = this.qts[i].member[3];
					this.qts[i].member[3] = this.qts[i].member[2];
					this.qts[i].member[2] = this.qts[i].member[1];
					this.qts[i].member[1] = t;
					this.qts[i].rotation += 1;
					if (this.qts[i].rotation > 2) {
						this.qts[i].rotation = 0;
					}
				} else {
					const t: Tile | undefined = this.qts[i].member[1];
					this.qts[i].member[1] = this.qts[i].member[2];
					this.qts[i].member[2] = this.qts[i].member[3];
					this.qts[i].member[3] = t;
					this.qts[i].rotation -= 1;
					if (this.qts[i].rotation < 0) {
						this.qts[i].rotation = 2;
					}
				}
				this.qts[k] = this.qts[i];
				k--;
			}
		}
		// remove nodes of [si..this.ngroups-1] that were not required for prune from
		// search tree
		for (let i = k; i >= si; i--) {
			this.qts[i] = qts2[--l];
		}
		// advance search
		for (let i = k; i >= si; i--) {
			this.qts[i].pairing = 2;
			if (this.sureSolve(i + 1)) {
				return true;
			}
			this.qts[i].pairing = 3;
			if (this.sureSolve(i + 1)) {
				return true;
			}
			this.qts[i].pairing = 0;
		}
		return false;
	}

	// iterative search routine to determine solvability, but not unsolvability
	// eslint-disable-next-line complexity
	private randomSolve(count: number): boolean {
		const nFree: Array<number> = []; // [maxGroups]
		const nMatches: Array<number> = [0, 0, 1, 3, 6];
		const p: Array<Array<number>> = [[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]];
		// play count games by randomly removing matches, until the  game is solved
		for (let n = 0; n < count; n++) {
			let nTiles2 = this.nTilesCount;
			// count matches
			for (let k = 0; k < this.nGroups; k++) {
				nFree[k] = 0;
				for (let l = 0; l < this.qt[k].nMembers; l++) {
					if (isPlayable(this.qt[k].member[l])) {
						nFree[k]++;
					}
				}
				this.qt[k].pairing = -1;
				if (this.qt[k].nMembers === 2) {
					this.qt[k].isPlayed = true;
				}
			}
			while (true) {
				let goLabel = false;
				let r = 0;
				for (let k1 = 0; k1 < this.nGroups; k1++) {
					if ((this.qt[k1].isPlayed ? 1 : 0) + nMatches[nFree[k1]] >= 5) {
						// last two tiles or four tiles of a group
						goLabel = true;// goto play_math;
						break;
					}
					r += nMatches[nFree[k1]];
				}
				if (!goLabel) {
					if (r === 0) {
						// no tiles to remove
						break;
					}
					r = rand() % r;
				}
				// play_match:
				let k = 0;
				do {
					r -= nMatches[nFree[k]];
					k++;
				} while (r >= 0);
				k--;
				r += nMatches[nFree[k]];
				let i = 0;
				const qtk = this.qt[k];
				let j = qtk.nMembers - 1;
				if (r <= 1) {
					// play the first
					let qtki = qtk.member[i] as Tile;
					while (qtki.isPlayed || !isPlayable(qtki)) {
						i++;
						qtki = qtk.member[i] as Tile;
					}
					if (r === 0) {
						j = i + 1;
						// play the next
						let qtkj = qtk.member[j] as Tile;
						while (qtkj.isPlayed || !isPlayable(qtkj)) {
							j++;
							qtkj = qtk.member[j] as Tile;
						}
					}
				}
				if (r >= 1) {
					// play the last
					let qtkj = qtk.member[j] as Tile;
					while (qtkj.isPlayed || !isPlayable(qtkj)) {
						j--;
						qtkj = qtk.member[j] as Tile;
					}
					if (r === 2) {
						i = j - 1;
						// play the previous
						let qtki = qtk.member[i] as Tile;
						while (qtki.isPlayed || !isPlayable(qtki)) {
							i--;
							qtki = qtk.member[i] as Tile;
						}
					}
				}
				nTiles2 = Solver.playTile(qtk.member[i] as Tile, nFree, nTiles2);
				nTiles2 = Solver.playTile(qtk.member[j] as Tile, nFree, nTiles2);
				qtk.isPlayed = true;
				qtk.pairing = p[i][j];
				nFree[k] -= 2;
			}
			for (let k = 0; k < this.nTilesCount; k++) {
				this.tl[k].isPlayed = false;
			}
			for (let k = 0; k < this.nGroups; k++) {
				this.qt[k].isPlayed = false;
				if (this.qt[k].nMembers === 2) {
					this.qt[k].pairing = 4;
				}
			}
			this.nrPlays++;
			if (nTiles2 <= this.remainMax) {
				for (let k = 0; k < this.nGroups; k++) {
					this.qt[k].bestPairing = this.qt[k].pairing;
				}
				this.remainMax = nTiles2 - 2;
				if (this.remainMax < this.remainMin) {
					for (let k = 0; k < this.nGroups; k++) {
						if (this.qt[k].nMembers === 4) {
							this.qt[k].pairing = 0;
						}
					}
					return true;
				}
			}
		}
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
