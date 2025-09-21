import type { Mapping, Place } from '../types';
import { blocksOverlap, key, randChoice, randInt, shuffleArray, buildUnitGrids, buildMappingFromSetZ0 } from './utilities';
import type { BaseLayerOptions } from './consts';

function punchHoles(base: Set<string>, baseZ: number, xs: Array<number>, ys: Array<number>, minHoles: number, maxHoles: number): void {
	const holes = randInt(minHoles, maxHoles);
	let attempts = holes * 4;
	const positions: Array<[number, number]> = [];
	for (const y of ys) {
		for (const x of xs) {
			positions.push([x, y]);
		}
	}
	shuffleArray(positions);
	let made = 0;
	while (made < holes && attempts-- > 0 && positions.length > 0) {
		const [x, y] = positions.pop()!;
		// avoid punching at extreme corners to keep connectivity
		if (x === xs[0] || x === xs.at(-1) || y === ys[0] || y === ys.at(-1)) {
			continue;
		}
		const k = key(baseZ, x, y);
		if (!base.has(k)) {
			continue;
		}
		// 50% chance to remove small 2x1 or 1x2 block to create bigger gaps (now using 1-step grid)
		const orient = Math.random() < 0.5 ? 'h' : 'v';
		const removed: Array<string> = [];
		if (orient === 'h') {
			removed.push(k);
			if (x + 1 <= xs.at(-1)!) {
				removed.push(key(baseZ, x + 1, y));
			}
		} else {
			removed.push(k);
			if (y + 1 <= ys.at(-1)!) {
				removed.push(key(baseZ, x, y + 1));
			}
		}
		let any = false;
		for (const rk of removed) {
			if (base.delete(rk)) {
				any = true;
			}
		}
		if (any) {
			made++;
		}
	}
}

function buildInitialChecker(present: Set<string>, xs: Array<number>, ys: Array<number>): void {
	for (const y of ys) {
		for (const x of xs) {
			if ((x % 2 !== 0) || (y % 2 !== 0)) {
				continue;
			}
			present.add(key(0, x, y));
		}
	}
}

function computeSideCuts(): { left: number; right: number; top: number; bottom: number } {
	const left = Math.random() < 0.5 ? 0 : randChoice([0, 0, 2, 2, 4]);
	const right = Math.random() < 0.5 ? 0 : randChoice([0, 0, 2, 2, 4]);
	const top = Math.random() < 0.5 ? 0 : randChoice([0, 2, 2, 4]);
	const bottom = Math.random() < 0.5 ? 0 : randChoice([0, 2, 2, 4]);
	return { left, right, top, bottom };
}

function applySideCuts(present: Set<string>, xs: Array<number>, ys: Array<number>, xMax: number, yMax: number, cuts: { left: number; right: number; top: number; bottom: number }): void {
	const { left, right, top, bottom } = cuts;
	for (const y of ys) {
		for (const x of xs) {
			if (x < left || x > xMax - right || y < top || y > yMax - bottom) {
				present.delete(key(0, x, y));
			}
		}
	}
}

function computeTargetBaseLength(baseCount: number, minTarget: number, maxTarget: number): number {
	return Math.min(Math.max(minTarget, Math.floor(baseCount * 0.45)), maxTarget);
}

function removeDownToTarget(present: Set<string>, mapping0: Mapping, targetBase: number): number {
	let baseCount = mapping0.length;
	if (baseCount <= targetBase) {
		return baseCount;
	}
	const arrayCopy = shuffleArray([...mapping0]);
	while (baseCount > targetBase && arrayCopy.length > 0) {
		const p = arrayCopy.pop()!;
		if (present.delete(key(0, p[1], p[2]))) {
			baseCount--;
		}
	}
	return baseCount;
}

function buildMissingCandidates(present: Set<string>, xs: Array<number>, ys: Array<number>): Array<Place> {
	const candidates: Array<Place> = [];
	for (const y of ys) {
		for (const x of xs) {
			if (!present.has(key(0, x, y))) {
				candidates.push([0, x, y]);
			}
		}
	}
	return candidates;
}

function addUpToTarget(present: Set<string>, candidates: Array<Place>, baseCount: number, targetBase: number): number {
	shuffleArray(candidates);
	let count = baseCount;
	while (count < targetBase && candidates.length > 0) {
		const [, x, y] = candidates.pop()!;
		if (!blocksOverlap(present, 0, x, y)) {
			present.add(key(0, x, y));
			count++;
		}
	}
	return count;
}

export function generateBaseLayerChecker({ minTarget, maxTarget, xMax, yMax }: BaseLayerOptions): Mapping {
	const present = new Set<string>();

	// Use step of 1 for both x and y for fine granularity
	const { xs, ys } = buildUnitGrids(xMax, yMax, 1);

	// start with a checkerboard-like base (no overlapping 2x2 on same z)
	buildInitialChecker(present, xs, ys);

	// carve side margins randomly to avoid full rectangle feel
	const cuts = computeSideCuts();
	applySideCuts(present, xs, ys, xMax, yMax, cuts);

	// punch random holes inside (more holes to thin base)
	punchHoles(present, 0, xs, ys, 6, 32);

	// rebuild mapping array for base z=0
	const mapping0: Mapping = buildMappingFromSetZ0(present, xMax, yMax, 1);

	// ensure not too few or too many in base; adjust by removing/adding randomly
	let baseCount = mapping0.length;
	const targetBase = computeTargetBaseLength(baseCount, minTarget, maxTarget);
	if (baseCount > targetBase) {
		baseCount = removeDownToTarget(present, mapping0, targetBase);
	} else if (baseCount < targetBase) {
		const candidates = buildMissingCandidates(present, xs, ys);
		baseCount = addUpToTarget(present, candidates, baseCount, targetBase);
	}
	return buildMappingFromSetZ0(present, xMax, yMax, 1);
}
