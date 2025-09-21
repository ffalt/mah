import type { Mapping } from '../types';
import { TARGET_COUNT, X_MAX, Y_MAX, Z_MAX } from './consts';
import { blocksOverlap, inBounds, isOdd, isSupported, key, randChoice, tryAdd } from './utilities';

function computeBelowWindow(current: Mapping, z: number): { minX: number; maxX: number; minY: number; maxY: number } | null {
	let minX = X_MAX, maxX = 0, minY = Y_MAX, maxY = 0;
	for (const [zz, xx, yy] of current) {
		if (zz === z - 1) {
			minX = Math.min(minX, xx);
			maxX = Math.max(maxX, xx);
			minY = Math.min(minY, yy);
			maxY = Math.max(maxY, yy);
		}
	}
	if (minX > maxX || minY > maxY) {
		return null;
	}
	return {
		minX: Math.max(0, minX - 2),
		maxX: Math.min(X_MAX, maxX + 2),
		minY: Math.max(0, minY - 2),
		maxY: Math.min(Y_MAX, maxY + 2)
	};
}

function bucketCandidates(present: Set<string>, z: number, win: { minX: number; maxX: number; minY: number; maxY: number }): {
	bridgeLarge: Array<[number, number]>;
	bridgeSmall: Array<[number, number]>;
	direct: Array<[number, number]>;
} {
	const bridgeLarge: Array<[number, number]> = [];
	const bridgeSmall: Array<[number, number]> = [];
	const direct: Array<[number, number]> = [];
	const zb = z - 1;
	for (let y = win.minY; y <= win.maxY; y++) {
		for (let x = win.minX; x <= win.maxX; x++) {
			const kHere = key(z, x, y);
			if (present.has(kHere) || !inBounds(x, y, z)) {
				continue;
			}
			const hasDirect = present.has(key(zb, x, y));
			const hasSmall = present.has(key(zb, x - 1, y)) && present.has(key(zb, x + 1, y));
			const hasLarge =
				present.has(key(zb, x - 1, y - 1)) &&
				present.has(key(zb, x + 1, y - 1)) &&
				present.has(key(zb, x - 1, y + 1)) &&
				present.has(key(zb, x + 1, y + 1));
			if (!(hasDirect || hasSmall || hasLarge)) {
				continue;
			}
			if (hasLarge) {
				bridgeLarge.push([x, y]);
			} else if (hasSmall) {
				bridgeSmall.push([x, y]);
			} else if (hasDirect) {
				direct.push([x, y]);
			}
		}
	}
	return { bridgeLarge, bridgeSmall, direct };
}

function maybeProposeOverhangs(present: Set<string>, z: number, win: { minX: number; maxX: number; minY: number; maxY: number }): Array<[number, number]> {
	const overhangs: Array<[number, number]> = [];
	const zb = z - 1;
	if (Math.random() < 0.25) {
		for (let y = win.minY; y <= win.maxY; y++) {
			for (let x = win.minX; x <= win.maxX; x++) {
				if (!present.has(key(zb, x, y))) {
					continue;
				}
				const directions: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
				const [dx, dy] = randChoice(directions);
				const ox = x + dx, oy = y + dy;
				if (!inBounds(ox, oy, z)) {
					continue;
				}
				const kh = key(z, ox, oy);
				if (present.has(kh)) {
					continue;
				}
				overhangs.push([ox, oy]);
			}
		}
	}
	return overhangs;
}

function computeLevelBudget(remaining: number): number {
	let levelBudget = Math.trunc(Math.random() * remaining);
	levelBudget -= (levelBudget % 2);
	return Math.max(levelBudget, 2);
}

function addWithMirrors(
	present: Set<string>,
	result: Mapping,
	z: number,
	x: number,
	y: number,
	mirrorX: boolean,
	mirrorY: boolean,
	mirX: (x: number) => number,
	mirY: (y: number) => number
): boolean {
	if (!tryAdd(present, result, z, x, y)) {
		return false;
	}
	if (mirrorX || mirrorY) {
		const mx = mirX(x);
		const my = mirY(y);
		if (mirrorX && mx !== x) {
			tryAdd(present, result, z, mx, y);
		}
		if (mirrorY && my !== y) {
			tryAdd(present, result, z, x, my);
		}
		if (mirrorX && mirrorY && ((mx !== x) || (my !== y))) {
			tryAdd(present, result, z, mx, my);
		}
	}
	return true;
}

function growLevel(current: Mapping, z: number, mirrorX: boolean, mirrorY: boolean): Mapping {
	// If already at target, return early
	if (current.length >= TARGET_COUNT) {
		return current;
	}

	// Determine scan window from layer z-1 extents
	const win = computeBelowWindow(current, z);
	if (!win) {
		return current;
	} // no layer below to support this level

	// Build a set of present positions for fast queries
	const present = new Set<string>(current.map(p => key(p[0], p[1], p[2])));

	// Collect candidate positions, bucketed by support type to encourage bridges
	const { bridgeLarge, bridgeSmall, direct } = bucketCandidates(present, z, win);
	const overhangs = maybeProposeOverhangs(present, z, win);

	// Define a per-level addition cap: leave some tiles for upper levels
	const remaining = TARGET_COUNT - current.length;
	const levelBudget = computeLevelBudget(remaining);
	let placed = 0;

	// Mirror helpers based on current layout
	const { mirX, mirY } = makeMirrorFns(current);

	const result: Mapping = [...current];

	const processBucket = (bucket: Array<[number, number]>) => {
		for (const [x, y] of bucket) {
			if (placed >= levelBudget || result.length >= TARGET_COUNT) {
				return;
			}
			if (addWithMirrors(present, result, z, x, y, mirrorX, mirrorY, mirX, mirY)) {
				placed++;
			}
		}
	};

	processBucket(bridgeLarge);
	processBucket(bridgeSmall);
	processBucket(direct);
	processBucket(overhangs);
	return result;
}

// Helper: perform a single vertical growth pass across all z levels
function runGrowthPass(mapping: Mapping, mirrorX: boolean, mirrorY: boolean): Mapping {
	let result = mapping;
	for (let z = 1; z <= Z_MAX && result.length < TARGET_COUNT; z++) {
		result = growLevel(result, z, mirrorX, mirrorY);
	}
	return result.length > TARGET_COUNT ? result.slice(0, TARGET_COUNT) : result;
}

// Helper: compute mirror functions based on current mapping extents
function makeMirrorFns(mapping: Mapping): { mirX: (x: number) => number; mirY: (y: number) => number } {
	const xsAll = mapping.map(p => p[1]);
	const ysAll = mapping.map(p => p[2]);
	const minBoardX = xsAll.length > 0 ? Math.min(...xsAll) : 0;
	const maxBoardX = xsAll.length > 0 ? Math.max(...xsAll) : X_MAX;
	const minBoardY = ysAll.length > 0 ? Math.min(...ysAll) : 0;
	const maxBoardY = ysAll.length > 0 ? Math.max(...ysAll) : Y_MAX;
	const midX = (minBoardX + maxBoardX) / 2;
	const midY = (minBoardY + maxBoardY) / 2;
	return {
		mirX: (x: number) => Math.round(2 * midX - x),
		mirY: (y: number) => Math.round(2 * midY - y)
	};
}

// Helper: try to place a position together with its mirror-orbit
function tryPlaceOrbit(
	mapping: Mapping,
	present: Set<string>,
	z: number,
	x: number,
	y: number,
	mirrorX: boolean,
	mirrorY: boolean,
	mirX: (x: number) => number,
	mirY: (y: number) => number
): boolean {
	const orbit: Array<[number, number]> = [[x, y]];
	if (mirrorX) {
		const mx = mirX(x);
		if (mx !== x) {
			orbit.push([mx, y]);
		}
	}
	if (mirrorY) {
		const my = mirY(y);
		if (!orbit.some(p => p[0] === x && p[1] === my)) {
			orbit.push([x, my]);
		}
		if (mirrorX) {
			const mx = mirX(x);
			const my2 = mirY(y);
			if (!orbit.some(p => p[0] === mx && p[1] === my2)) {
				orbit.push([mx, my2]);
			}
		}
	}
	for (const [ox, oy] of orbit) {
		if (!inBounds(ox, oy, z)) {
			return false;
		}
		const kk = key(z, ox, oy);
		if (present.has(kk)) {
			return false;
		}
		if (!isSupported(present, z, ox, oy)) {
			return false;
		}
		if (blocksOverlap(present, z, ox, oy)) {
			return false;
		}
	}
	if (mapping.length + orbit.length > TARGET_COUNT) {
		return false;
	}
	for (const [ox, oy] of orbit) {
		const kk = key(z, ox, oy);
		present.add(kk);
		mapping.push([z, ox, oy]);
	}
	return true;
}

// Helper: symmetric randomized fill until no progress
function symmetricFill(mapping: Mapping, mirrorX: boolean, mirrorY: boolean): Mapping {
	const present = new Set<string>(mapping.map(p => key(p[0], p[1], p[2])));
	const { mirX, mirY } = makeMirrorFns(mapping);
	let progress = true;
	while (mapping.length < TARGET_COUNT && progress) {
		progress = false;
		for (let z = 0; z <= Z_MAX && mapping.length < TARGET_COUNT; z++) {
			const candidates: Array<[number, number]> = [];
			for (let y = 0; y <= Y_MAX; y++) {
				for (let x = 0; x <= X_MAX; x++) {
					if (!inBounds(x, y, z)) {
						continue;
					}
					if (present.has(key(z, x, y))) {
						continue;
					}
					candidates.push([x, y]);
				}
			}
			for (let index = candidates.length - 1; index > 0; index--) {
				const index_ = Math.floor(Math.random() * (index + 1));
				[candidates[index], candidates[index_]] = [candidates[index_], candidates[index]];
			}
			for (const [x, y] of candidates) {
				if (mapping.length >= TARGET_COUNT) {
					break;
				}
				if (tryPlaceOrbit(mapping, present, z, x, y, mirrorX, mirrorY, mirX, mirY)) {
					progress = true;
				}
			}
		}
	}
	return mapping;
}

// Helper: compute search window around existing mapping
function computeWindow(mapping: Mapping): { minX: number; maxX: number; minY: number; maxY: number } {
	let minX = X_MAX, maxX = 0, minY = Y_MAX, maxY = 0;
	for (const [, xx, yy] of mapping) {
		minX = Math.min(minX, xx);
		maxX = Math.max(maxX, xx);
		minY = Math.min(minY, yy);
		maxY = Math.max(maxY, yy);
	}
	return {
		minX: Math.max(0, minX - 2),
		maxX: Math.min(X_MAX, maxX + 2),
		minY: Math.max(0, minY - 2),
		maxY: Math.min(Y_MAX, maxY + 2)
	};
}

// Helper: try to add exactly one tile within the window scanning from top to bottom
function tryAddOne(mapping: Mapping, present: Set<string>, win: { minX: number; maxX: number; minY: number; maxY: number }): boolean {
	for (let z = Z_MAX; z >= 0; z--) {
		for (let y = win.minY; y <= win.maxY; y++) {
			for (let x = win.minX; x <= win.maxX; x++) {
				if (!inBounds(x, y, z)) {
					continue;
				}
				const k = key(z, x, y);
				if (present.has(k)) {
					continue;
				}
				if (!isSupported(present, z, x, y)) {
					continue;
				}
				if (blocksOverlap(present, z, x, y)) {
					continue;
				}
				present.add(k);
				mapping.push([z, x, y]);
				return true;
			}
		}
	}
	return false;
}

// Helper: build a map of how many tiles each tile supports above
function buildSupportCounts(mapping: Mapping): Map<string, number> {
	const supports = new Map<string, number>();
	for (const [z, x, y] of mapping) {
		supports.set(key(z, x, y), 0);
	}
	for (const [z, x, y] of mapping) {
		if (z === 0) {
			continue;
		}
		const zb = z - 1;
		const belowCandidates = [
			key(zb, x, y),
			key(zb, x - 1, y), key(zb, x + 1, y),
			key(zb, x - 1, y - 1), key(zb, x + 1, y - 1), key(zb, x - 1, y + 1), key(zb, x + 1, y + 1)
		];
		for (const kb of belowCandidates) {
			if (supports.has(kb)) {
				supports.set(kb, (supports.get(kb) || 0) + 1);
			}
		}
	}
	return supports;
}

// Helper: choose index of a removable tile, prefer highest z with zero dependents
function chooseRemovableIndex(mapping: Mapping, supports: Map<string, number>): number {
	let chosen = -1;
	let bestZ = -1;
	for (let index = mapping.length - 1; index >= 0; index--) {
		const [z, x, y] = mapping[index];
		const k = key(z, x, y);
		if ((supports.get(k) || 0) === 0 && z >= bestZ) {
			chosen = index;
			bestZ = z;
		}
	}
	return chosen;
}

// Helper: ensure even tile count; try to add one, otherwise remove one
function ensureEven(mapping: Mapping): Mapping {
	if (!isOdd(mapping.length)) {
		return mapping;
	}
	const present = new Set<string>(mapping.map(p => key(p[0], p[1], p[2])));
	const win = computeWindow(mapping);
	if (tryAddOne(mapping, present, win) || mapping.length === 0) {
		return mapping;
	}
	const supports = buildSupportCounts(mapping);
	const index = chooseRemovableIndex(mapping, supports);
	if (index >= 0) {
		mapping.splice(index, 1);
	} else {
		mapping.pop();
	}
	return mapping;
}

export function fillLayout(baseLayer: Mapping, mirrorX: boolean, mirrorY: boolean): Mapping {
	let mapping = [...baseLayer];
	let passes = 0;
	while (mapping.length < TARGET_COUNT && passes < 50) {
		passes++;
		const before = mapping.length;
		mapping = runGrowthPass(mapping, mirrorX, mirrorY);
		if (mapping.length === before) {
			break;
		}
	}
	if (mapping.length < TARGET_COUNT) {
		mapping = symmetricFill(mapping, mirrorX, mirrorY);
	}
	if (mapping.length > TARGET_COUNT) {
		mapping = mapping.slice(0, TARGET_COUNT);
	}
	mapping = ensureEven(mapping);
	return mapping;
}
