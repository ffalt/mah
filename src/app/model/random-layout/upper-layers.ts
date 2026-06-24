import type { Mapping } from '../types';
import { TARGET_COUNT, X_MAX, Y_MAX, Z_MAX } from './consts';
import { blocksOverlap, inBounds, isOdd, isSupported, key, type NonEmptyArray, randChoice, shuffleArray, tryAdd } from './utilities';
import { rng } from '../rng';

interface TilesWindow {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

function expandWindow(minX: number, maxX: number, minY: number, maxY: number): TilesWindow {
	return {
		minX: Math.max(0, minX - 2),
		maxX: Math.min(X_MAX, maxX + 2),
		minY: Math.max(0, minY - 2),
		maxY: Math.min(Y_MAX, maxY + 2)
	};
}

function computeBelowWindow(current: Mapping, z: number): TilesWindow | null {
	let minX = X_MAX;
	let maxX = 0;
	let minY = Y_MAX;
	let maxY = 0;
	for (const [zz, xx, yy] of current) {
		if (zz !== z - 1) {
			continue;
		}

		minX = Math.min(minX, xx);
		maxX = Math.max(maxX, xx);
		minY = Math.min(minY, yy);
		maxY = Math.max(maxY, yy);
	}
	return minX > maxX || minY > maxY ? null : expandWindow(minX, maxX, minY, maxY);
}

function bucketCandidates(present: Set<string>, z: number, win: TilesWindow): {
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

function maybeProposeOverhangs(present: Set<string>, z: number, win: TilesWindow): Array<[number, number]> {
	if (rng() >= 0.25) {
		return [];
	}
	const overhangs: Array<[number, number]> = [];
	const zb = z - 1;
	for (let y = win.minY; y <= win.maxY; y++) {
		for (let x = win.minX; x <= win.maxX; x++) {
			if (!present.has(key(zb, x, y))) {
				continue;
			}
			const directions: NonEmptyArray<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
			const [dx, dy] = randChoice(directions);
			const ox = x + dx;
			const oy = y + dy;
			if (!inBounds(ox, oy, z) || present.has(key(z, ox, oy))) {
				continue;
			}
			overhangs.push([ox, oy]);
		}
	}
	return overhangs;
}

function computeLevelBudget(remaining: number): number {
	const budget = Math.trunc(rng() * remaining);
	return Math.max(budget - (budget % 2), 2);
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
	const win = computeBelowWindow(current, z);
	if (!win) {
		return current;
	}

	const present = new Set<string>(current.map(p => key(p[0], p[1], p[2])));

	const { bridgeLarge, bridgeSmall, direct } = bucketCandidates(present, z, win);
	const overhangs = maybeProposeOverhangs(present, z, win);

	// leave some tiles for upper levels
	const remaining = TARGET_COUNT - current.length;
	const levelBudget = computeLevelBudget(remaining);
	let placed = 0;

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

	shuffleArray(bridgeLarge);
	shuffleArray(bridgeSmall);
	shuffleArray(direct);
	shuffleArray(overhangs);
	processBucket(bridgeLarge);
	processBucket(bridgeSmall);
	processBucket(direct);
	processBucket(overhangs);
	return result;
}

function runGrowthPass(mapping: Mapping, mirrorX: boolean, mirrorY: boolean): Mapping {
	let result = mapping;
	for (let z = 1; z <= Z_MAX && result.length < TARGET_COUNT; z++) {
		result = growLevel(result, z, mirrorX, mirrorY);
	}
	return result.length > TARGET_COUNT ? result.slice(0, TARGET_COUNT) : result;
}

function makeMirrorFns(mapping: Mapping): { mirX: (x: number) => number; mirY: (y: number) => number } {
	const xs = mapping.map(p => p[1]);
	const ys = mapping.map(p => p[2]);
	const minBoardX = xs.length > 0 ? Math.min(...xs) : 0;
	const maxBoardX = xs.length > 0 ? Math.max(...xs) : X_MAX;
	const minBoardY = ys.length > 0 ? Math.min(...ys) : 0;
	const maxBoardY = ys.length > 0 ? Math.max(...ys) : Y_MAX;
	const midX = (minBoardX + maxBoardX) / 2;
	const midY = (minBoardY + maxBoardY) / 2;
	return {
		mirX: (x: number) => Math.round(2 * midX - x),
		mirY: (y: number) => Math.round(2 * midY - y)
	};
}

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
	const mx = mirX(x);
	const my = mirY(y);
	if (mirrorX && mx !== x) {
		orbit.push([mx, y]);
	}
	if (mirrorY && my !== y) {
		orbit.push([x, my]);
	}
	if (mirrorX && mirrorY && mx !== x && my !== y) {
		orbit.push([mx, my]);
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
					if (present.has(key(z, x, y))) {
						continue;
					}
					candidates.push([x, y]);
				}
			}
			shuffleArray(candidates);
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

function computeWindow(mapping: Mapping): TilesWindow {
	let minX = X_MAX;
	let maxX = 0;
	let minY = Y_MAX;
	let maxY = 0;
	for (const [, xx, yy] of mapping) {
		minX = Math.min(minX, xx);
		maxX = Math.max(maxX, xx);
		minY = Math.min(minY, yy);
		maxY = Math.max(maxY, yy);
	}
	return expandWindow(minX, maxX, minY, maxY);
}

function tryAddOne(mapping: Mapping, present: Set<string>, win: TilesWindow): boolean {
	const candidates: Array<[number, number, number]> = [];
	for (let z = Z_MAX; z >= 0; z--) {
		for (let y = win.minY; y <= win.maxY; y++) {
			for (let x = win.minX; x <= win.maxX; x++) {
				if (!inBounds(x, y, z) || present.has(key(z, x, y))) {
					continue;
				}
				if (isSupported(present, z, x, y) && !blocksOverlap(present, z, x, y)) {
					candidates.push([z, x, y]);
				}
			}
		}
	}
	shuffleArray(candidates);
	if (candidates.length > 0) {
		const [z, x, y] = candidates[0];
		present.add(key(z, x, y));
		mapping.push([z, x, y]);
		return true;
	}
	return false;
}

function ensureEven(mapping: Mapping): Mapping {
	if (!isOdd(mapping.length)) {
		return mapping;
	}
	const present = new Set<string>(mapping.map(p => key(p[0], p[1], p[2])));
	const win = computeWindow(mapping);
	tryAddOne(mapping, present, win);
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
