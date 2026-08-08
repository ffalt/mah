import type { Mapping, Place } from '../types';
import { blocksOverlap, key, randChoice, randInt, shuffleArray, buildUnitGrids, buildMappingFromSetZ0 } from './utilities';
import { rng } from '../rng';
import type { BaseLayerOptions } from './consts';

export function isGridCorner(x: number, y: number, xs: Array<number>, ys: Array<number>): boolean {
	const onXEdge = x === xs[0] || x === xs.at(-1);
	const onYEdge = y === ys[0] || y === ys.at(-1);
	return onXEdge && onYEdge;
}

function punchHoles(base: Set<string>, baseZ: number, xs: Array<number>, ys: Array<number>, minHoles: number, maxHoles: number): void {
	const holes = randInt(minHoles, maxHoles);
	const positions: Array<[number, number]> = [];
	for (const y of ys) {
		for (const x of xs) {
			positions.push([x, y]);
		}
	}
	shuffleArray(positions);
	let made = 0;
	while (made < holes && positions.length > 0) {
		const [x, y] = positions.pop()!;
		if (isGridCorner(x, y, xs, ys)) {
			continue;
		}
		const k = key(baseZ, x, y);
		if (!base.has(k)) {
			continue;
		}
		const orient = rng() < 0.5 ? 'h' : 'v';
		const removed: Array<string> = [k];
		if (orient === 'h') {
			if (x + 2 <= xs.at(-1)!) {
				removed.push(key(baseZ, x + 2, y));
			}
		} else {
			if (y + 2 <= ys.at(-1)!) {
				removed.push(key(baseZ, x, y + 2));
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
			if ((x % 2 === 0) && (y % 2 === 0)) {
				present.add(key(0, x, y));
			}
		}
	}
}

function computeSideCuts(): { left: number; right: number; top: number; bottom: number } {
	const left = rng() < 0.5 ? 0 : randChoice([0, 0, 2, 2, 4]);
	const right = rng() < 0.5 ? 0 : randChoice([0, 0, 2, 2, 4]);
	const top = rng() < 0.5 ? 0 : randChoice([0, 2, 2, 4]);
	const bottom = rng() < 0.5 ? 0 : randChoice([0, 2, 2, 4]);
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
	const { xs, ys } = buildUnitGrids(xMax, yMax, 1);
	buildInitialChecker(present, xs, ys);
	const cuts = computeSideCuts();
	applySideCuts(present, xs, ys, xMax, yMax, cuts);
	punchHoles(present, 0, xs, ys, 6, 32);
	const mapping0: Mapping = buildMappingFromSetZ0(present, xMax, yMax, 1);
	const baseCount = mapping0.length;
	const targetBase = computeTargetBaseLength(baseCount, minTarget, maxTarget);
	if (baseCount > targetBase) {
		removeDownToTarget(present, mapping0, targetBase);
	} else if (baseCount < targetBase) {
		const candidates = buildMissingCandidates(present, xs, ys);
		addUpToTarget(present, candidates, baseCount, targetBase);
	}
	return buildMappingFromSetZ0(present, xMax, yMax, 1);
}
