import { afterEach, describe, expect, it, vi } from 'vitest';
import { SolveInit } from './solver.init';
import type { Group, Tile } from './solver.types';

const GROUPS = 150;
const MEMBERS = 4;

function makeTile(value: number): Tile {
	return {
		left: [undefined, undefined, undefined],
		right: [undefined, undefined, undefined],
		above: [undefined, undefined, undefined, undefined, undefined],
		below: [undefined, undefined, undefined, undefined, undefined],
		value,
		isPlayed: false
	};
}

function runSetup(): Array<Group> {
	const tileList = Array.from({ length: GROUPS * MEMBERS }, (_, index) => makeTile(Math.floor(index / MEMBERS)));
	// the neighbour passes need an allocated grid; keep it minimal, they do not
	// influence the search-order shuffle under test
	const lo: Array<Array<Array<Tile | undefined>>> = [[[undefined], [undefined]]];
	const qts: Array<Group> = [];
	new SolveInit(tileList, lo, qts, 1, 2, 1, GROUPS, tileList.length).initSolve();
	return qts;
}

const orderOf = (qts: Array<Group>): Array<number> => qts.map(group => group.member[0]!.value);

describe('SolveInit search order', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('places every group in the search path exactly once', () => {
		const qts = runSetup();
		expect(qts).toHaveLength(GROUPS);
		expect(new Set(orderOf(qts))).toHaveLength(GROUPS);
	});

	// A correct Fisher-Yates draws from the whole populated range, so a draw pinned to the
	// top of that range swaps every slot with itself and leaves the order untouched. The
	// old `rand() % range` clamped the draw to 99, so from slot 2 onwards it swapped with
	// the wrong partner and the order came out scrambled.
	it('swaps each slot with itself when the draw lands at the top of the range', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.999);
		expect(orderOf(runSetup())).toEqual(Array.from({ length: GROUPS }, (_, index) => index));
	});

	it('still shuffles when left to real randomness', () => {
		const identity = Array.from({ length: GROUPS }, (_, index) => index);
		const runs = Array.from({ length: 5 }, () => orderOf(runSetup()));
		expect(runs.some(run => JSON.stringify(run) !== JSON.stringify(identity))).toBe(true);
	});
});
