import { afterEach, describe, expect, it, vi } from 'vitest';
import { SolverRandomSolve } from './solver.random';
import type { Group, Tile } from './solver.types';

// Every group holds two free tiles, so each contributes exactly one match and none of them
// trips the forced-play shortcut. With more than 100 groups `totalMatches` passes 100,
// which is where the old `rand() % totalMatches` ran out of range.
const GROUPS = 120;
const MEMBERS = 2;

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

function build(): { tileList: Array<Tile>; tileGroups: Array<Group> } {
	const tileList = Array.from({ length: GROUPS * MEMBERS }, (_, index) => makeTile(Math.floor(index / MEMBERS)));
	const tileGroups: Array<Group> = Array.from({ length: GROUPS }, (_, group) => ({
		pairing: 4,
		bestPairing: -1,
		nMembers: MEMBERS,
		member: [tileList[group * MEMBERS], tileList[(group * MEMBERS) + 1], undefined, undefined],
		isPlayed: false,
		rotation: 0
	}));
	return { tileList, tileGroups };
}

// records the group of the very first tile the solver plays, by intercepting the
// isPlayed write rather than reaching into the closure
function trackFirstPlayed(tiles: Array<Tile>): () => number | undefined {
	let first: number | undefined;
	for (const tile of tiles) {
		let played = false;
		Object.defineProperty(tile, 'isPlayed', {
			get: () => played,
			set: (value: boolean) => {
				if (value && first === undefined) {
					first = tile.value;
				}
				played = value;
			},
			configurable: true
		});
	}
	return () => first;
}

function firstGroupPlayed(): number | undefined {
	const { tileList, tileGroups } = build();
	const first = trackFirstPlayed(tileList);
	new SolverRandomSolve(tileList.length, GROUPS, tileList, tileGroups, 0, 0).randomSolve(1);
	return first();
}

describe('SolverRandomSolve match selection', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	// the draw must span all 120 matches; the old code clamped it to 0..99 and then took
	// `% 120`, so the walk could never get past group 99
	it('selects a group from the whole match range', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.9);
		expect(firstGroupPlayed()).toBe(Math.floor(0.9 * GROUPS));
	});

	it('selects the first group when the draw is at the bottom of the range', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0);
		expect(firstGroupPlayed()).toBe(0);
	});

	it('reaches groups past the first 100 match slots', () => {
		const seen = new Set<number>();
		for (let run = 0; run < 300; run++) {
			seen.add(firstGroupPlayed()!);
		}
		expect(Math.max(...seen)).toBeGreaterThan(99);
		expect(Math.max(...seen)).toBeLessThan(GROUPS);
	});
});

// A group with three free members is the widest choice the random branch ever sees: with
// four free members nMatches[4] is 6, which trips the forced-play shortcut and pins
// matchIndex to 0. So the reachable range is matchIndex 0..2 over three distinct pairs.
describe('SolverRandomSolve pair selection', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	function blockedTile(): Tile {
		return { ...makeTile(99), isPlayed: false };
	}

	// members 0..2 free, member 3 permanently blocked from above => nFree === 3
	function buildThreeFreeGroup(): { tileList: Array<Tile>; tileGroups: Array<Group> } {
		const tileList = Array.from({ length: 4 }, () => makeTile(0));
		tileList[3].above[0] = blockedTile();
		const tileGroups: Array<Group> = [{
			pairing: 0,
			bestPairing: -1,
			nMembers: 4,
			member: [tileList[0], tileList[1], tileList[2], tileList[3]],
			isPlayed: false,
			rotation: 0
		}];
		return { tileList, tileGroups };
	}

	// remainMax has to allow the two tiles left over, otherwise handleSolution bails out
	// before copying the pairing into bestPairing
	function playedPair(draw: number): Array<number> {
		const { tileList, tileGroups } = buildThreeFreeGroup();
		vi.spyOn(Math, 'random').mockReturnValue(draw);
		new SolverRandomSolve(tileList.length, 1, tileList, tileGroups, 0, tileList.length).randomSolve(1);
		vi.restoreAllMocks();
		// resetState clears isPlayed, so read the pairing the play recorded instead
		return [tileGroups[0].bestPairing];
	}

	it('maps the three reachable draws onto the three distinct pairs', () => {
		// draws 0, 1 and 2 of nMatches[3] === 3 give pairs (0,1) (0,2) (1,2),
		// whose pairing schemes are 1, 2 and 3
		expect(playedPair(0.1)).toEqual([1]);
		expect(playedPair(0.5)).toEqual([2]);
		expect(playedPair(0.9)).toEqual([3]);
	});

	// #18: the old scan walked off the member tuple with no bounds check when the free
	// count and the actually playable members disagreed
	it('stops cleanly when fewer members are playable than the free count claims', () => {
		const tileList = Array.from({ length: 4 }, () => makeTile(0));
		// blockers that report "not blocking" on their first read and block afterwards, so
		// members 1 and 2 count as free during setup and are gone by the time a pair is picked
		for (const index of [1, 2]) {
			let reads = 0;
			const blocker = blockedTile();
			Object.defineProperty(blocker, 'isPlayed', { get: () => ++reads === 1 });
			tileList[index].above[0] = blocker;
		}
		tileList[3].above[0] = blockedTile();
		const tileGroups: Array<Group> = [{
			pairing: 0,
			bestPairing: -1,
			nMembers: 4,
			member: [tileList[0], tileList[1], tileList[2], tileList[3]],
			isPlayed: false,
			rotation: 0
		}];

		vi.spyOn(Math, 'random').mockReturnValue(0.9);
		expect(() => new SolverRandomSolve(4, 1, tileList, tileGroups, 0, 0).randomSolve(1)).not.toThrow();
	});
});
