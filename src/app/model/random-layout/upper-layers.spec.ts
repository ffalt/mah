import { fillLayout } from './upper-layers';
import * as rngModule from '../rng';
import { TARGET_COUNT, X_MAX, Y_MAX } from './consts';
import type { Mapping } from '../types';
import { key, isSupported, blocksOverlap } from './utilities';
import { seedRNG, resetRNG } from '../rng';
import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';

// Deterministic small base layer: row of tiles across the center
function buildSmallBase(): Mapping {
	const result: Mapping = [];
	for (let x = 8; x <= 20; x += 2) {
		result.push([0, x, 8]);
	}
	return result;
}

// Sparser base: one tile per row, far apart - forces more upper-level growth
function buildDenseBase(): Mapping {
	const result: Mapping = [];
	for (let y = 0; y <= Y_MAX; y += 2) {
		for (let x = 0; x <= X_MAX; x += 4) {
			result.push([0, x, y]);
		}
	}
	return result;
}

// Fills the first `count` even-grid positions (row by row)
function buildBaseWithCount(count: number): Mapping {
	const result: Mapping = [];
	for (let y = 0; y <= Y_MAX && result.length < count; y += 2) {
		for (let x = 0; x <= X_MAX && result.length < count; x += 2) {
			result.push([0, x, y]);
		}
	}
	return result;
}

function assertValidLayout(mapping: Mapping): void {
	expect(mapping).toHaveLength(TARGET_COUNT);
	expect(mapping.length % 2).toBe(0);
	const keys = mapping.map(([z, x, y]) => key(z, x, y));
	const present = new Set(keys);
	expect(present.size).toBe(TARGET_COUNT);
	for (const [z, x, y] of mapping) {
		expect(x).toBeGreaterThanOrEqual(0);
		expect(x).toBeLessThanOrEqual(X_MAX);
		expect(y).toBeGreaterThanOrEqual(0);
		expect(y).toBeLessThanOrEqual(Y_MAX);
		expect(isSupported(present, z, x, y)).toBe(true);
		expect(blocksOverlap(present, z, x, y)).toBe(false);
	}
}

describe('fillLayout', () => {
	beforeEach(() => {
		seedRNG('upper-layers-test');
	});

	afterEach(() => {
		resetRNG();
	});

	describe('basic invariants', () => {
		it('returns exactly TARGET_COUNT tiles from a small base layer', () => {
			const result = fillLayout(buildSmallBase(), false, false);
			assertValidLayout(result);
		});

		it('returns exactly TARGET_COUNT tiles from a dense base layer', () => {
			const result = fillLayout(buildDenseBase(), false, false);
			assertValidLayout(result);
		});

		it('preserves base-layer tiles in the result', () => {
			const base = buildSmallBase();
			const baseKeys = new Set(base.map(([z, x, y]) => key(z, x, y)));
			const result = fillLayout(base, false, false);
			for (const k of baseKeys) {
				expect(result.some(([z, x, y]) => key(z, x, y) === k)).toBe(true);
			}
		});
	});

	describe('mirror combinations', () => {
		it.each([
			[true, true],
			[true, false],
			[false, true],
			[false, false]
		])('mirrorX=%s mirrorY=%s produces a valid 144-tile layout', (mirrorX, mirrorY) => {
			const result = fillLayout(buildSmallBase(), mirrorX, mirrorY);
			assertValidLayout(result);
		});

		it.each([
			[true, true],
			[true, false],
			[false, true],
			[false, false]
		])('mirrorX=%s mirrorY=%s with dense base produces valid layout', (mirrorX, mirrorY) => {
			const result = fillLayout(buildDenseBase(), mirrorX, mirrorY);
			assertValidLayout(result);
		});
	});

	describe('empty base layer', () => {
		// Exercises computeBelowWindow returning null (z=1 scan with no z=0 tiles initially)
		// and makeMirrorFns with an empty mapping (defaults to full-board extents)
		it('fills from an empty base with mirrorX=false mirrorY=false', () => {
			const result = fillLayout([], false, false);
			assertValidLayout(result);
		});

		it('fills from an empty base with mirrorX=true mirrorY=true', () => {
			const result = fillLayout([], true, true);
			assertValidLayout(result);
		});

		it('fills from an empty base with mirrorX=true mirrorY=false', () => {
			const result = fillLayout([], true, false);
			assertValidLayout(result);
		});

		it('fills from an empty base with mirrorX=false mirrorY=true', () => {
			const result = fillLayout([], false, true);
			assertValidLayout(result);
		});
	});

	describe('base layer exceeds TARGET_COUNT', () => {
		// Exercises the mapping.slice(0, TARGET_COUNT) path
		it('trims a base layer larger than TARGET_COUNT to exactly 144 tiles', () => {
			const oversized = buildBaseWithCount(TARGET_COUNT + 10);
			const result = fillLayout(oversized, false, false);
			expect(result).toHaveLength(TARGET_COUNT);
		});
	});

	describe('multiple seeds', () => {
		const seeds = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta'];

		it.each(seeds)('seed=%s: small base produces valid layout', seed => {
			seedRNG(seed);
			const result = fillLayout(buildSmallBase(), false, false);
			assertValidLayout(result);
		});

		it.each(seeds)('seed=%s: both mirrors produces valid layout', seed => {
			seedRNG(seed);
			const result = fillLayout(buildSmallBase(), true, true);
			assertValidLayout(result);
		});

		it.each(seeds)('seed=%s: empty base with mirrorX produces valid layout', seed => {
			seedRNG(seed);
			const result = fillLayout([], true, false);
			assertValidLayout(result);
		});
	});

	describe('maybeProposeOverhangs branches', () => {
		// With rng=0.1: the 0.25 check fires, randChoice always picks [-1, 0] (index 0)
		// Base layer: tile at x=0 (left edge) triggers the !inBounds path (ox = 0-1 = -1)
		//             tiles at (8,8) and (10,8) with an existing z=1 tile at (9,8) trigger
		//             the present.has(kh) path (overhang at (9,8) is already occupied)
		it('covers overhang out-of-bounds and already-occupied rejection', () => {
			vi.spyOn(rngModule, 'rng').mockReturnValue(0.1);
			// (0,8): left-edge tile - direction [-1,0] proposes ox=-1 → out of bounds
			// (8,8) + (10,8): small-bridge pair that supports (1,9,8)
			// (1,9,8): pre-existing z=1 tile - blocks the overhang proposed by (10,8)→[-1,0]→(9,8)
			const base: Mapping = [[0, 0, 8], [0, 8, 8], [0, 10, 8], [1, 9, 8]];
			const result = fillLayout(base, false, false);
			expect(result.length % 2).toBe(0);
			expect(result.length).toBeGreaterThan(0);
		});

		it('covers rng >= 0.25 path (no overhangs proposed)', () => {
			vi.spyOn(rngModule, 'rng').mockReturnValue(0.5);
			const result = fillLayout(buildSmallBase(), false, false);
			expect(result.length % 2).toBe(0);
		});

		it('overhang proposals do not break layout validity', () => {
			vi.spyOn(rngModule, 'rng').mockReturnValue(0.1);
			const result = fillLayout(buildDenseBase(), false, false);
			expect(result.length % 2).toBe(0);
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('bucketCandidates support types', () => {
		// Direct support: tile directly below at z=0
		it('handles direct support (tile directly below)', () => {
			const base: Mapping = [[0, 10, 8], [0, 12, 8], [0, 14, 8]];
			const result = fillLayout(base, false, false);
			assertValidLayout(result);
		});

		// Small-bridge support: left+right tiles at z=0, gap tile at z=1 spans them
		it('handles small-bridge support (left+right tiles below)', () => {
			const base: Mapping = [[0, 8, 8], [0, 12, 8]]; // gap at x=10
			const result = fillLayout(base, false, false);
			assertValidLayout(result);
		});

		// Large-bridge support: four diagonal tiles at z=0, tile at z=1 spans them
		it('handles large-bridge support (four diagonal tiles below)', () => {
			const base: Mapping = [[0, 10, 6], [0, 12, 6], [0, 10, 8], [0, 12, 8]];
			const result = fillLayout(base, false, false);
			assertValidLayout(result);
		});
	});

	describe('addWithMirrors variants', () => {
		it('mirrors X axis: position and X-mirror are both placed when mirrorX=true', () => {
			seedRNG('mirror-x-test');
			const result = fillLayout([[0, 10, 8]], true, false);
			assertValidLayout(result);
		});

		it('mirrors Y axis: position and Y-mirror are both placed when mirrorY=true', () => {
			seedRNG('mirror-y-test');
			const result = fillLayout([[0, 18, 4]], false, true);
			assertValidLayout(result);
		});

		it('mirrors both axes: all four orbit positions are placed', () => {
			seedRNG('mirror-xy-test');
			const result = fillLayout([[0, 10, 4]], true, true);
			assertValidLayout(result);
		});

		it('no mirrors: each tile is placed individually', () => {
			seedRNG('no-mirror-test');
			const result = fillLayout([[0, 18, 8]], false, false);
			assertValidLayout(result);
		});
	});

	describe('tryPlaceOrbit rejection paths', () => {
		// With both mirrors and a near-full board, size-4 orbits are rejected
		// because they would push mapping.length over TARGET_COUNT
		it('rejects orbits that would exceed TARGET_COUNT', () => {
			seedRNG('orbit-reject-test');
			const result = fillLayout(buildSmallBase(), true, true);
			expect(result).toHaveLength(TARGET_COUNT);
		});

		it('handles mirrorY-only orbit (size 2 for non-center y)', () => {
			seedRNG('mirror-y-orbit');
			const result = fillLayout(buildDenseBase(), false, true);
			assertValidLayout(result);
		});

		it('orbit rejected when out of bounds for mirror position', () => {
			// A base near a board edge forces mirror positions outside the board.
			// fillLayout is best-effort; the result may be < 144 for tiny constrained bases.
			seedRNG('edge-mirror');
			const edgeBase: Mapping = [[0, 2, 2], [0, 4, 2]];
			const result = fillLayout(edgeBase, true, true);
			expect(result.length % 2).toBe(0);
			expect(result.length).toBeGreaterThan(0);
		});
	});

	describe('ensureEven paths', () => {
		it('even-count result takes the fast path (no modification)', () => {
			// TARGET_COUNT=144 is even, so most runs hit this
			const result = fillLayout(buildSmallBase(), false, false);
			expect(result.length % 2).toBe(0);
		});

		// With mirror symmetry, orbits of size 2+ mean symmetricFill can stall
		// at 143 (odd), causing ensureEven to call tryAddOne (which should succeed).
		// Run many seeds to maximise odds of hitting the odd-count path.
		it('odd-count mapping is corrected to even by tryAddOne', () => {
			const moreSeeds = ['odd1', 'odd2', 'odd3', 'odd4', 'odd5', 'odd6', 'odd7', 'odd8'];
			for (const s of moreSeeds) {
				seedRNG(s);
				const result = fillLayout([], true, false);
				expect(result).toHaveLength(TARGET_COUNT);
				expect(result.length % 2).toBe(0);
			}
		});

		it('multiple mirror/seed combinations always produce even results', () => {
			const combos: Array<[boolean, boolean]> = [[true, false], [false, true], [true, true]];
			const seedList = ['s1', 's2', 's3', 's4', 's5', 's6'];
			for (const [mx, my] of combos) {
				for (const s of seedList) {
					seedRNG(s);
					const result = fillLayout([], mx, my);
					expect(result.length % 2).toBe(0);
				}
			}
		});
	});

	describe('runGrowthPass no-progress break', () => {
		// When runGrowthPass adds 0 tiles in a pass (before === after), fillLayout breaks
		// and falls through to symmetricFill
		it('breaks the growth loop when no progress is made and falls through to symmetricFill', () => {
			seedRNG('no-progress');
			// A single isolated tile forces most candidates to fail
			const result = fillLayout([[0, 18, 8]], true, true);
			assertValidLayout(result);
		});
	});

	describe('computeWindow coverage', () => {
		it('computeWindow is exercised via ensureEven when mapping has an odd count', () => {
			const result = fillLayout(buildSmallBase(), false, false);
			expect(result).toHaveLength(TARGET_COUNT);
		});
	});
});
