import type { StonePosition } from '../stone';
import type { Place } from '../types';
import { Group, Tile } from './solver.types';
import { SolveInit } from './solver.init';
import { SolverWriter } from './solver.writer';
import { SolverPrune } from './solver.prune';
import { rand } from './solver.tools';
import { SolverRandomSolve } from './solver.random';

export class Solver {
	nTilesCount: number; // number of tiles
	nPlays: number; // number of "game simulations" of randomSolve and sureSolve
	nrPlays: number;
	tileList: Array<Tile> = []; // [4 * maxGroups]
	// group array, indexed by group value
	tileGroups: Array<Group> = []; // [maxGroups]
	// pointers of grid positions to tile array, to describe layout
	lo: Array<Array<Array<Tile | undefined>>> = []; // [maxHeight][maxWidth][maxDepth]
	// array of pointers to groups, indexes in order of search path
	qts: Array<Group> = []; // [maxGroups]
	// start index and bottom index of search path
	qtsIndex: number;
	nGroups: number;
	remainMax: number; // search interval for the number of tiles that remains finally
	remainMin: number;
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
			this.tileList.push(t);
		}

		this.nTilesCount = stones.length;
		return this.solve(0, 0);
	}

	writeGame(): Array<Place> {
		this.unrotateGroups();
		const writer = new SolverWriter(this.nTilesCount, this.tileGroups, this.lo, this.nGroups, this.maxHeight, this.maxWidth, this.maxDepth);
		return writer.write();
	}

	// stores the solution found
	private unrotateGroups(): void {
		for (let index = 0; index < this.nGroups; index++) {
			switch (this.tileGroups[index].rotation) {
				case 1: {
					const t: Tile | undefined = this.tileGroups[index].member[1];
					this.tileGroups[index].member[1] = this.tileGroups[index].member[2];
					this.tileGroups[index].member[2] = this.tileGroups[index].member[3];
					this.tileGroups[index].member[3] = t;
					break;
				}
				case 2: {
					const t: Tile | undefined = this.tileGroups[index].member[3];
					this.tileGroups[index].member[3] = this.tileGroups[index].member[2];
					this.tileGroups[index].member[2] = this.tileGroups[index].member[1];
					this.tileGroups[index].member[1] = t;
					break;
				}
				default: {
					break;
				}
			}
			this.tileGroups[index].rotation = 0;
		}
	}

	private sureSolve_checkInitialPrune(): boolean {
		return this.prune() > this.remainMax;
	}

	private sureSolve_findPrunePoint(start: number): number {
		for (let k = start; k < this.nGroups; k++) {
			this.qts[k].pairing = 1;
			if (this.prune() > this.remainMax) {
				return k;
			}
		}
		return this.nGroups;
	}

	private sureSolve_handleSolutionFound(startIndex: number): boolean {
		// Save best pairings
		for (let index = 0; index < this.nGroups; index++) {
			this.tileGroups[index].bestPairing = this.tileGroups[index].pairing;
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

	private sureSolve_rotateTiles(groupIndex: number, clockwise: boolean): void {
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

	private sureSolve_identifyRequiredNodes(prunePoint: number, startIndex: number): number {
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
				this.sureSolve_rotateTiles(index, rand() % 2 === 0);
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

	private sureSolve_tryAdvancedPairings(prunePoint: number, startIndex: number): boolean {
		for (let index = prunePoint; index >= startIndex; index--) {
			this.qts[index].pairing = 2;
			if (this.sureSolve(index + 1)) return true;

			this.qts[index].pairing = 3;
			if (this.sureSolve(index + 1)) return true;

			this.qts[index].pairing = 0;
		}
		return false;
	}

	private sureSolve(startIndex: number): boolean {
		// recursive search routine to determine (un)solvability improves speed by changing search order backwards
		if (this.sureSolve_checkInitialPrune()) return false;

		const prunePoint = this.sureSolve_findPrunePoint(startIndex);

		if (prunePoint === this.nGroups) {
			return this.sureSolve_handleSolutionFound(startIndex);
		}

		const finalPrunePoint = this.sureSolve_identifyRequiredNodes(prunePoint, startIndex);
		return this.sureSolve_tryAdvancedPairings(finalPrunePoint, startIndex);
	}

	private init(): void {
		const result = (new SolveInit(
			this.tileList, this.lo, this.qts,
			this.maxHeight, this.maxWidth, this.maxDepth, this.maxGroups,
			this.nTilesCount)).initSolve();
		this.tileGroups = result.tileGroups;
		this.qtsIndex = result.qtsIndex;
		this.nGroups = result.nGroups;
	}

	private prune(): number {
		this.nPlays++;
		return (new SolverPrune(this.nTilesCount, this.nGroups, this.tileList, this.tileGroups)).prune();
	}

	private randomSolve(count: number): boolean {
		const result = new SolverRandomSolve(this.nTilesCount, this.nGroups, this.tileList, this.tileGroups, this.remainMin, this.remainMax).randomSolve(count);
		this.remainMax = result.remainMax;
		this.nrPlays += result.nrPlays;
		return result.success;
	}

	private solve(remain1: number, remain2: number): number {
		this.init();
		this.nrPlays = 0;
		this.nPlays = 0;
		this.remainMax = Math.max(remain1, remain2);
		this.remainMin = Math.min(remain1, remain2);
		if (this.prune() > this.remainMax) {
			return this.remainMax + 2;
		}
		const count = Math.floor(1.2 ** (this.nGroups - this.qtsIndex));
		if (this.randomSolve(count)) {
			return this.remainMax + 2;
		}
		this.sureSolve(this.qtsIndex);
		this.unrotateGroups();
		return this.remainMax + 2;
	}
}
