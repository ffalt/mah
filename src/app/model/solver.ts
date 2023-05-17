import {StonePosition} from './stone';
import {Place} from './types';

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

interface tile {
	// undefined-terminated arrays of neighbo(u)rs
	left: Array<tile | undefined>;//[3]
	right: Array<tile | undefined>;//[3]
	above: Array<tile | undefined>;//[5]
	below: Array<tile | undefined>;//[5]
	// The group of the tile (0-35)
	value: number;
	// If the tile has been played already by the solver during the routine prune()
	isPlayed: boolean;
}

// computes if a tile can be played by the solver
function isplayable(t?: tile): boolean {
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

interface group {
// the pairing of the four tiles (0-5): see prune() for
// more info
	pairing: number;
// number of tiles with the value of this group
	nmembers: number;
// array of tiles of this group
	member: Array<tile | undefined>; //[4];
// whether all tiles are already played
	isplayed: boolean;
// the pairing for the best partial solution found this far
	bestpairing: number;
// how often the last three tiles are cycled
	rotation: number;
}

export class SolverWriter {
	ntiles1: number;
	ntiles2: number;
	result: Array<Place> = [];

	constructor(ntilesCount: number,
							private qt: Array<group>,
							private lo: Array<Array<Array<tile | undefined>>>,
							private ngroups: number,
							private maxheight: number,
							private maxwidth: number,
							private maxdepth: number
	) {
		this.ntiles1 = ntilesCount;
		this.ntiles2 = ntilesCount;
	}

	write() {
		// play until no tiles can be removed anymore
		do {
			this.ntiles1 = this.ntiles2;
			for (let k = 0; k < this.ngroups; k++) {
				this.writeGroup(k);
			}
		} while (this.ntiles2 !== this.ntiles1);
		return this.result;
	}

	private writePair(k: number, a: number, b: number) {
		const t1: tile = this.qt[k].member[a] as tile;
		const t2: tile = this.qt[k].member[b] as tile;
		for (let row = 0; row < this.maxheight; row++) {
			for (let col = 0; col < this.maxwidth; col++) {
				for (let lev = 0; lev < this.maxdepth; lev++) {
					if (this.lo[row][col][lev] === t1 || this.lo[row][col][lev] === t2) {
						this.result.push([lev, col, row]);
					}
				}
			}
		}
	}

	private writePairing(k: number, qtk: group, a: number, b: number): boolean {
		const qtmA = qtk.member[a] as tile;
		const qtmB = qtk.member[b] as tile;
		if (qtmA && qtmB && !(qtmA.isPlayed) && isplayable(qtmA) && isplayable(qtmB)) {
			this.writePair(k, a, b);
			qtmA.isPlayed = true;
			qtmB.isPlayed = true;
			this.ntiles2 -= 2;
			return true;
		}
		return false;
	}

	private writeGroup(k: number) {
		const qtk = this.qt[k];
		switch (qtk.bestpairing) {
			case 1: // pairing 0-1, 2-3
				if (this.writePairing(k, qtk, 0, 1)) {
					const qtm2 = qtk.member[2] as tile;
					qtk.isplayed = qtm2.isPlayed;
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
	ntilesCount: number;
	// number of "game simulations" of randomsolve and suresolve
	nplays: number;
	nrplays: number;
	// tile array;
	tl: Array<tile> = []; //[4*maxgroups];
	// group array, indexed by group value
	qt: Array<group> = []; // [maxgroups];
	// pointers of grid positions to tile array, to describe layout
	lo: Array<Array<Array<tile | undefined>>> = []; // [maxheight][maxwidth][maxdepth];
	// array of pointers to groups, indexes in order of
	// search path
	qts: Array<group> = []; //[maxgroups];
	// start index and bottom index of search path
	qtsindex: number;
	ngroups: number;
	// search interval for the number of tiles that remains finally
	remainMax: number;
	remainMin: number;
	aborted: boolean; // for aborting the solver

	maxgroups: number = 80;
	maxheight: number = 40;
	maxwidth: number = 100;
	maxdepth: number = 10;

	solveLayout(stones: Array<StonePosition>): number {
		// clear layout pointers
		for (let row = 0; row < this.maxheight; row++) {
			this.lo[row] = [];
			for (let col = 0; col < this.maxwidth; col++) {
				this.lo[row][col] = [];
				for (let lev = 0; lev < this.maxdepth; lev++) {
					this.lo[row][col][lev] = undefined;
				}
			}
		}
		stones.forEach(stone => {
			const t: tile = {
				left: [],
				right: [],
				above: [],
				below: [],
				value: stone.groupnr,
				// If the tile has been played already by the solver during the routine prune()
				isPlayed: false
			};
			this.lo[stone.y][stone.x][stone.z] = t;
			this.tl.push(t);
		});

		this.ntilesCount = stones.length;
		return this.solve(0, 0);
	}

	writeGame(): Array<Place> {
		this.unrotateGroups();
		const writer = new SolverWriter(this.ntilesCount, this.qt, this.lo, this.ngroups, this.maxheight, this.maxwidth, this.maxdepth);
		return writer.write();
	}

	// play a tile for randomsolve
	private static playTile(t: tile, nfree: Array<number>, ntiles2: number): number {
		let ntiles3 = ntiles2;
		for (let i = 0; t.left[i] !== undefined; i++) {
			const tleft = t.left[i] as tile;
			if (!tleft.isPlayed) {
				nfree[tleft.value] -= isplayable(tleft) ? 1 : 0;
			}
		}
		for (let i = 0; t.right[i] !== undefined; i++) {
			const tright = t.right[i] as tile;
			if (!tright.isPlayed) {
				nfree[tright.value] -= isplayable(tright) ? 1 : 0;
			}
		}
		t.isPlayed = true;
		ntiles3--;
		for (let i = 0; t.left[i] !== undefined; i++) {
			const tleft = t.left[i] as tile;
			if (!tleft.isPlayed) {
				nfree[tleft.value] += isplayable(tleft) ? 1 : 0;
			}
		}
		for (let i = 0; t.right[i] !== undefined; i++) {
			const tright = t.right[i] as tile;
			if (!tright.isPlayed) {
				nfree[tright.value] += isplayable(tright) ? 1 : 0;
			}
		}
		for (let i = 0; t.below[i] !== undefined; i++) {
			const tbelow = t.below[i] as tile;
			nfree[tbelow.value] += isplayable(tbelow) ? 1 : 0;
		}
		return ntiles3;
	}

	// initializes both randomsolve and suresolve
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
		for (let row = 0; row < this.maxheight; row++) {
			for (let col = 2; col < this.maxwidth; col++) {
				for (let lev = 0; lev < this.maxdepth; lev++) {
					const tile = this.lo[row][col][lev];
					if (tile !== undefined) {
						let k = 0;
						for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxheight); r++) {
							if (this.lo[r][col - 2][lev] !== undefined) {
								tile.left[k] = this.lo[r][col - 2][lev];
								k++;
							}
						}
					}
					const tile2 = this.lo[row][col - 2][lev];
					if (tile2 !== undefined) {
						let k = 0;
						for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxheight); r++) {
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
		for (let row = 0; row < this.maxheight; row++) {
			for (let col = 0; col < this.maxwidth; col++) {
				for (let lev = 1; lev < this.maxdepth; lev++) {
					const tile = this.lo[row][col][lev - 1];
					if (tile !== undefined) {
						let k = 0;
						for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxheight); r++) {
							for (let c = Math.max(col - 1, 0); c < Math.min(col + 2, this.maxwidth); c++) {
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
						for (let r = Math.max(row - 1, 0); r < Math.min(row + 2, this.maxheight); r++) {
							for (let c = Math.max(col - 1, 0); c < Math.min(col + 2, this.maxwidth); c++) {
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
		for (let k = 0; k < this.maxgroups; k++) {
			const qtk: group = {
				pairing: -1,
				bestpairing: -1,
				nmembers: 0,
				member: [],
				isplayed: false,
				rotation: 0
			};
			this.qt.push(qtk);
		}
		// collect groups
		for (let k = 0; k < this.ntilesCount; k++) {
			const v = this.tl[k].value;
			this.qt[v].member[this.qt[v].nmembers] = this.tl[k];
			this.qt[v].nmembers++;
		}
		// initialize search system of suresolve
		let l = 0;
		let lq = 0;
		for (let k = 0; k < this.maxgroups; k++) {
			const gtk = this.qt[k];
			if (gtk.nmembers === 2) {
				this.qts[l] = gtk;
				this.qts[l].pairing = 4;
				l++;
			}
			if (gtk.nmembers !== 0) {
				lq = k;
			}
		}
		for (let k = 0; k <= lq; k++) {
			const gtk = this.qt[k];
			if (gtk.nmembers === 0) {
				this.qts[l] = gtk;
				this.qts[l].pairing = -1;
				l++;
			}
		}
		this.qtsindex = l;
		for (let k = 0; k <= lq; k++) {
			const gtk = this.qt[k];
			if (gtk.nmembers === 4) {
				this.qts[l] = gtk;
				this.qts[l].pairing = 0;
				const d: group = this.qts[l];
				const r = rand() % (l + 1 - this.qtsindex);
				this.qts[l] = this.qts[this.qtsindex + r];
				this.qts[this.qtsindex + r] = d;
				l++;
			}
		}
		this.ngroups = l;
		this.aborted = false;
	}

	// test solvability with the given pairing of all tiles
	// eslint-disable-next-line complexity
	private prune(): number {
		let ntiles1 = this.ntilesCount;
		let ntiles2 = this.ntilesCount;
		this.nplays++;
		// play until no tiles can be removed anymore
		do {
			ntiles1 = ntiles2;
			for (let k = 0; k < this.ngroups; k++) {
				const qtk = this.qt[k];
				if (!qtk.isplayed) {
					const qtk0 = qtk.member[0] as tile;
					const qtk1 = qtk.member[1] as tile;
					const qtk2 = qtk.member[2] as tile;
					const qtk3 = qtk.member[3] as tile;
					const play = (t1: tile, t2: tile) => {
						t1.isPlayed = true;
						t2.isPlayed = true;
						ntiles2 -= 2;
					};
					const check_free = (t: tile) => {
						if (!(t.isPlayed) && isplayable(t)) {
							t.isPlayed = true;
							ntiles1++;
						}
					};
					const check_pair = (t1: tile, t2: tile, t3: tile) => {
						if (!t1.isPlayed && isplayable(t1) && isplayable(t2)) {
							play(t1, t2);
							qtk.isplayed = t3.isPlayed;
						}
					};
					switch (qtk.pairing) {
						case 0: { // free group, no pairing
							// first two played together,
							// last two played separate
							if (qtk0.isPlayed || qtk1.isPlayed || qtk2.isPlayed) {
								qtk.member.forEach(t => check_free(t as tile));
								if (qtk0.isPlayed && qtk1.isPlayed && qtk2.isPlayed && qtk3.isPlayed) {
									qtk.isplayed = true;
									ntiles2 -= 2;
								}
							} else {
								if (!qtk0.isPlayed && isplayable(qtk0)) {
									if (!qtk1.isPlayed && isplayable(qtk1)) {
										play(qtk0, qtk1);
									} else if (!qtk2.isPlayed && isplayable(qtk2)) {
										play(qtk0, qtk2);
									} else if (!(qtk3.isPlayed) && isplayable(qtk3)) {
										play(qtk0, qtk3);
									}
								} else if (!qtk1.isPlayed && isplayable(qtk1)) {
									if (!qtk2.isPlayed && isplayable(qtk2)) {
										play(qtk1, qtk2);
									} else if (!qtk3.isPlayed && isplayable(qtk.member[3])) {
										play(qtk1, qtk3);
									}
								} else if (!qtk2.isPlayed && isplayable(qtk2)) {
									if (!qtk3.isPlayed && isplayable(qtk3)) {
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
							if (isplayable(qtk0) && isplayable(qtk1)) {
								play(qtk0, qtk1);
								qtk.isplayed = true;
							}
							break;
						}
						case 5: {// all four removed simultaneously
							// for heuristic to smell blockades
							if (isplayable(qtk0) && isplayable(qtk1) && isplayable(qtk2) && isplayable(qtk3)) {
								play(qtk0, qtk1);
								play(qtk2, qtk3);
								qtk.isplayed = true;
							}
							break;
						}
						default:
							break;
					}
				}
			}
		} while (ntiles2 !== ntiles1);
		// unplay all played tiles
		for (let k = 0; k < this.ntilesCount; k++) {
			this.tl[k].isPlayed = false;
		}
		for (let k = 0; k < this.ngroups; k++) {
			this.qt[k].isplayed = false;
		}
		// test if all tiles were removed
		return ntiles2;
	}

	// stores the solution found
	private unrotateGroups(): void {
		for (let i = 0; i < this.ngroups; i++) {
			switch (this.qt[i].rotation) {
				case 1: {
					const t: tile | undefined = this.qt[i].member[1];
					this.qt[i].member[1] = this.qt[i].member[2];
					this.qt[i].member[2] = this.qt[i].member[3];
					this.qt[i].member[3] = t;
					break;
				}
				case 2: {
					const t: tile | undefined = this.qt[i].member[3];
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
		const qts2: Array<group> = []; // [maxgroups];
		// test whether the current branch might still lead to a solution
		if (this.prune() > this.remainMax) {
			return false;
		}
		let k;
		// descent left in search tree until on bottom or having found a prune
		for (k = si; k < this.ngroups; k++) {
			this.qts[k].pairing = 1;
			// test whether a prune is found
			if (this.prune() > this.remainMax) {
				break;
			}
		}
		// test whether on bottom of search tree
		if (k === this.ngroups) {
			// solution found
			for (let i = 0; i < this.ngroups; i++) {
				this.qt[i].bestpairing = this.qt[i].pairing;
			}
			for (let i = this.qtsindex; i < this.ngroups; i++) {
				this.qts[i].bestpairing += 3 - this.qts[i].rotation;
				if (this.qts[i].bestpairing > 3) {
					this.qts[i].bestpairing -= 3;
				}
			}
			// redefine remain_max such that next solutions will be better
			this.remainMax = this.prune() - 2;
			if (this.remainMax < this.remainMin) {
				// no need to search further: remain_min tiles remaining is good enough
				for (let i = this.qtsindex; i < this.ngroups; i++) {
					this.qts[i].pairing = 0;
				}
				return true;
			} else {
				// search for better solution: redo suresolve with smaller remain_max
				for (k = si; k < this.ngroups; k++) {
					this.qts[k].pairing = 0;
				}
				return this.sureSolve(si);
			}
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
					const t: tile | undefined = this.qts[i].member[3];
					this.qts[i].member[3] = this.qts[i].member[2];
					this.qts[i].member[2] = this.qts[i].member[1];
					this.qts[i].member[1] = t;
					this.qts[i].rotation += 1;
					if (this.qts[i].rotation > 2) {
						this.qts[i].rotation = 0;
					}
				} else {
					const t: tile | undefined = this.qts[i].member[1];
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
		const nfree: Array<number> = []; // [maxgroups];
		const nmatches: Array<number> = [0, 0, 1, 3, 6];
		const p: Array<Array<number>> = [[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 0, 1], [3, 2, 1, 0]];
		// play count games by randomly removing matches, until the  game is solved
		for (let n = 0; n < count; n++) {
			let ntiles2 = this.ntilesCount;
			// count matches
			for (let k = 0; k < this.ngroups; k++) {
				nfree[k] = 0;
				for (let l = 0; l < this.qt[k].nmembers; l++) {
					if (isplayable(this.qt[k].member[l])) {
						nfree[k]++;
					}
				}
				this.qt[k].pairing = -1;
				if (this.qt[k].nmembers === 2) {
					this.qt[k].isplayed = true;
				}
			}
			// eslint-disable-next-line no-constant-condition
			while (1) {
				let go_label = false;
				let r = 0;
				for (let k1 = 0; k1 < this.ngroups; k1++) {
					if ((this.qt[k1].isplayed ? 1 : 0) + nmatches[nfree[k1]] >= 5) {
						// last two tiles or four tiles of a group
						go_label = true;// goto play_math;
						break;
					}
					r += nmatches[nfree[k1]];
				}
				if (!go_label) {
					if (r === 0) {
						// no tiles to remove
						break;
					}
					r = rand() % r;
				}
				// play_match:
				let k = 0;
				do {
					r -= nmatches[nfree[k]];
					k++;
				} while (r >= 0);
				k--;
				r += nmatches[nfree[k]];
				let i = 0;
				const qtk = this.qt[k];
				let j = qtk.nmembers - 1;
				if (r <= 1) {
					// play the first
					let qtki = qtk.member[i] as tile;
					while (qtki.isPlayed || !isplayable(qtki)) {
						i++;
						qtki = qtk.member[i] as tile;
					}
					if (r === 0) {
						j = i + 1;
						// play the next
						let qtkj = qtk.member[j] as tile;
						while (qtkj.isPlayed || !isplayable(qtkj)) {
							j++;
							qtkj = qtk.member[j] as tile;
						}
					}
				}
				if (r >= 1) {
					// play the last
					let qtkj = qtk.member[j] as tile;
					while (qtkj.isPlayed || !isplayable(qtkj)) {
						j--;
						qtkj = qtk.member[j] as tile;
					}
					if (r === 2) {
						i = j - 1;
						// play the previous
						let qtki = qtk.member[i] as tile;
						while (qtki.isPlayed || !isplayable(qtki)) {
							i--;
							qtki = qtk.member[i] as tile;
						}
					}
				}
				ntiles2 = Solver.playTile(qtk.member[i] as tile, nfree, ntiles2);
				ntiles2 = Solver.playTile(qtk.member[j] as tile, nfree, ntiles2);
				qtk.isplayed = true;
				qtk.pairing = p[i][j];
				nfree[k] -= 2;
			}
			for (let k = 0; k < this.ntilesCount; k++) {
				this.tl[k].isPlayed = false;
			}
			for (let k = 0; k < this.ngroups; k++) {
				this.qt[k].isplayed = false;
				if (this.qt[k].nmembers === 2) {
					this.qt[k].pairing = 4;
				}
			}
			this.nrplays++;
			if (ntiles2 <= this.remainMax) {
				for (let k = 0; k < this.ngroups; k++) {
					this.qt[k].bestpairing = this.qt[k].pairing;
				}
				this.remainMax = ntiles2 - 2;
				if (this.remainMax < this.remainMin) {
					for (let k = 0; k < this.ngroups; k++) {
						if (this.qt[k].nmembers === 4) {
							this.qt[k].pairing = 0;
						}
					}
					return true;
				}
			}
		}
		for (let k = 0; k < this.ngroups; k++) {
			if (this.qt[k].nmembers === 4) {
				this.qt[k].pairing = 0;
			}
		}
		return false;
	}

	private solve(remain1: number, remain2: number): number {
		this.initSolve();
		this.nrplays = 0;
		this.nplays = 0;
		this.remainMax = Math.max(remain1, remain2);
		this.remainMin = Math.min(remain1, remain2);
		if (this.prune() > this.remainMax) {
			return this.remainMax + 2;
		}
		if (this.randomSolve(int(Math.pow(1.2, (this.ngroups - this.qtsindex))))) {
			return this.remainMax + 2;
		}
		this.sureSolve(this.qtsindex);
		this.unrotateGroups();
		return this.remainMax + 2;
	}

}
