/* eslint-disable complexity */
import type { Mapping, Place } from './types';
import { optimizeMapping } from '../modules/editor/model/import';

// Random Mahjong board generator that produces a mapping of exactly 144 places
// abiding by the following constraints:
// - Bounds: x in [0..36], y in [0..16], z in [0..5]
// - Uniqueness: each [z,x,y] at most once
// - Support: for z>0, supported by same (x,y) at z-1 or orthogonal neighbor at distance 1
// - Avoids huge solid areas by punching holes and using sparse upper layers
// - Uses a 1-step grid for x and y

export const RANDOM_LAYOUT_ID_PREFIX = 'random-';

const X_MAX = 36;
const Y_MAX = 16;
const Z_MAX = 5; // 0..5 (6 layers) but we typically use up to 3-4
const TARGET_COUNT = 144;

function key(z: number, x: number, y: number): string {
	return `${z}|${x}|${y}`;
}

function randInt(min: number, maxInclusive: number): number {
	return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

function randChoice<T>(array: Array<T>): T {
	return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray<T>(array: Array<T>): Array<T> {
	for (let index = array.length - 1; index > 0; index--) {
		const index2 = Math.floor(Math.random() * (index + 1));
		[array[index], array[index2]] = [array[index2], array[index]];
	}
	return array;
}

function inBounds(x: number, y: number, z: number): boolean {
	return x >= 0 && x <= X_MAX && y >= 0 && y <= Y_MAX && z >= 0 && z <= Z_MAX;
}

function blocksOverlap(present: Set<string>, z: number, x: number, y: number): boolean {
	// Disallow placing (z,x,y) if any tile exists within the 3x3 neighborhood on the same z
	// Blocked positions relative to (x,y): all 8 neighbors: (±1,0), (0,±1), (±1,±1)
	return (
		present.has(key(z, x - 1, y - 1)) ||
		present.has(key(z, x, y - 1)) ||
		present.has(key(z, x + 1, y - 1)) ||
		present.has(key(z, x - 1, y)) ||
		/* center (x,y) checked before via uniqueness */
		present.has(key(z, x + 1, y)) ||
		present.has(key(z, x - 1, y + 1)) ||
		present.has(key(z, x, y + 1)) ||
		present.has(key(z, x + 1, y + 1))
	);
}

// Support rule used for z>0: direct below, small bridge (left+right), or large bridge (four diagonals)
function isSupported(present: Set<string>, z: number, x: number, y: number): boolean {
	if (z === 0) return true;
	const zb = z - 1;
	// 1) direct below
	if (present.has(key(zb, x, y))) return true;
	// 2) small bridge left+right
	if (present.has(key(zb, x - 1, y)) && present.has(key(zb, x + 1, y))) return true;
	// 3) large bridge four diagonals
	if (
		present.has(key(zb, x - 1, y - 1)) &&
		present.has(key(zb, x + 1, y - 1)) &&
		present.has(key(zb, x - 1, y + 1)) &&
		present.has(key(zb, x + 1, y + 1))
	) return true;
	return false;
}

// Try to add a tile to mapping with full validation
function tryAdd(present: Set<string>, mapping: Mapping, z: number, x: number, y: number): boolean {
	if (!inBounds(x, y, z)) return false;
	const k = key(z, x, y);
	if (present.has(k)) return false;
	if (!isSupported(present, z, x, y)) return false;
	if (blocksOverlap(present, z, x, y)) return false;
	present.add(k);
	mapping.push([z, x, y]);
	return true;
}

function punchHoles(base: Set<string>, baseZ: number, xs: Array<number>, ys: Array<number>, minHoles: number, maxHoles: number): void {
	const holes = randInt(minHoles, maxHoles);
	let attempts = holes * 4;
	const positions: Array<[number, number]> = [];
	for (const y of ys) for (const x of xs) positions.push([x, y]);
	shuffleArray(positions);
	let made = 0;
	while (made < holes && attempts-- > 0 && positions.length > 0) {
		const [x, y] = positions.pop()!;
		// avoid punching at extreme corners to keep connectivity
		if (x === xs[0] || x === xs.at(-1) || y === ys[0] || y === ys.at(-1)) continue;
		const k = key(baseZ, x, y);
		if (!base.has(k)) continue;
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
			if (base.delete(rk)) any = true;
		}
		if (any) made++;
	}
}

function generateBaseLayerLines(minTarget: number, maxTarget: number, xMax: number, yMax: number): Mapping {
	// Build exactly one continuous snake-like line on z=0.
	// Self-crossing in terms of path is conceptually allowed, but we still enforce the 3x3 no-overlap
	// rule for placements, so the snake will meander without adjacent placements on the same level.

	const present = new Set<string>();
	const mapping: Mapping = [];
	const snakeKeys = new Set<string>(); // track tiles that belong to the snake so we don't delete them later
	// Use step of 1 for global grid but place only on even-even to respect no-overlap spacing naturally.
	const xs: Array<number> = [];
	for (let x = 0; x <= xMax; x += 1) xs.push(x);
	const ys: Array<number> = [];
	for (let y = 0; y <= yMax; y += 1) ys.push(y);

	function addBase(x: number, y: number, markSnake = false): boolean {
		if ((x % 2 !== 0) || (y % 2 !== 0)) return false;
		if (!inBounds(x, y, 0)) return false;
		const k0 = key(0, x, y);
		if (present.has(k0)) return false;
		if (blocksOverlap(present, 0, x, y)) return false;
		present.add(k0);
		mapping.push([0, x, y]);
		if (markSnake) snakeKeys.add(k0);
		return true;
	}

	// Start near the center on even-even
	let sx = Math.floor(xMax / 2);
	let sy = Math.floor(yMax / 2);
	sx -= sx % 2;
	sy -= sy % 2;
	if (!inBounds(sx, sy, 0)) {
		sx = 0;
		sy = 0;
	}
	addBase(sx, sy, true);

	// Single snake that meanders; length proportional to board size
	const basePerimeter = xMax + yMax;
	const minLength = Math.max(40, Math.floor(basePerimeter * 0.8));
	const maxLength = Math.max(minLength + 100, Math.floor(basePerimeter * 2));
	const targetLength = randInt(minLength, maxLength);

	let x = sx;
	let y = sy;
	const directionsAll: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
	let direction: [number, number] = directionsAll[Math.floor(Math.random() * 4)];

	for (let step = 0; step < targetLength; step++) {
		// Increase randomness by varying turn propensity and shuffling direction preferences per step
		const wobble = (step % randInt(6, 12)) === 0 ? Math.random() * 0.6 + 0.2 : Math.random() * 0.3; // occasionally very turny
		// Build candidate directions: continue, orthogonals, reverse; then randomly shuffle with slight bias to continue
		const cont: [number, number] = [direction[0], direction[1]];
		const rev: [number, number] = [-direction[0], -direction[1]];
		const orth: Array<[number, number]> = direction[0] === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
		let tryDirections: Array<[number, number]> = [cont, ...orth, rev];
		// With probability wobble, reshuffle the order heavily to create more random movement
		if (Math.random() < wobble) tryDirections = shuffleArray(tryDirections);
		// 20% of the time, prefer an orthogonal first to force zig-zagging
		if (Math.random() < 0.2) {
			tryDirections = [...shuffleArray([...orth]), cont, rev];
		}
		let moved = false;
		for (const [dx1, dy1] of tryDirections) {
			const nx1 = x + dx1 * 2;
			const ny1 = y + dy1 * 2;
			if (inBounds(nx1, ny1, 0) && addBase(nx1, ny1, true)) {
				x = nx1;
				y = ny1;
				direction = [dx1, dy1];
				moved = true;
				break;
			}
		}
		if (moved) continue;
		// If blocked, attempt a tiny zig-zag burst: try two-step pattern (turn then forward), but place only the first step
		const stepDirections: Array<[number, number]> = shuffleArray([[1, 0], [-1, 0], [0, 1], [0, -1]]);
		let placed = false;
		for (const [dxA, dyA] of stepDirections) {
			const ax = x + dxA * 2;
			const ay = y + dyA * 2;
			if (!inBounds(ax, ay, 0) || blocksOverlap(present, 0, ax, ay) || present.has(key(0, ax, ay))) continue;
			if (addBase(ax, ay, true)) {
				x = ax;
				y = ay;
				direction = [dxA, dyA];
				placed = true;
				break;
			}
		}
		if (!placed) {
			// Nowhere to go; terminate the snake early.
			break;
		}
	}

	// Optionally trim edges: remove tiles too close to borders to avoid flat edges
	const leftCut = Math.random() < 0.4 ? randChoice([0, 0, 2]) : 0;
	const rightCut = Math.random() < 0.4 ? randChoice([0, 0, 2]) : 0;
	const topCut = Math.random() < 0.4 ? randChoice([0, 2]) : 0;
	const bottomCut = Math.random() < 0.4 ? randChoice([0, 2]) : 0;
	for (const yy of ys) for (const xx of xs) {
		if (xx < leftCut || xx > xMax - rightCut || yy < topCut || yy > yMax - bottomCut) {
			const k0 = key(0, xx, yy);
			// keep snake tiles intact to avoid holes in the line
			if (!snakeKeys.has(k0)) present.delete(k0);
		}
	}

	// Build baseMapping
	const baseMapping: Mapping = [];
	for (const yy of ys) for (const xx of xs) if (present.has(key(0, xx, yy))) baseMapping.push([0, xx, yy]);

	// Normalize base density to a thin range to encourage upper layers
	let baseCount = baseMapping.length;
	const targetBase = Math.min(Math.max(minTarget, Math.floor(baseCount * 0.9)), maxTarget);
	if (baseCount > targetBase) {
		// Do not remove snake tiles; remove only non-snake to keep continuity
		const copy = shuffleArray([...baseMapping].filter(p => !snakeKeys.has(key(0, p[1], p[2]))));
		while (baseCount > targetBase && copy.length > 0) {
			const p = copy.pop()!;
			if (present.delete(key(0, p[1], p[2]))) baseCount--;
		}
	} else if (baseCount < targetBase) {
		// Prefer adding tiles adjacent to the snake to preserve a continuous line feel
		const nearSnake: Array<Place> = [];
		const others: Array<Place> = [];
		for (const yy of ys) for (const xx of xs) if (!present.has(key(0, xx, yy))) {
			const neighbors: Array<[number, number]> = [
				[xx - 2, yy], [xx + 2, yy], [xx, yy - 2], [xx, yy + 2]
			];
			const adjSnake = neighbors.some(([nx, ny]) => snakeKeys.has(key(0, nx, ny)));
			(adjSnake ? nearSnake : others).push([0, xx, yy]);
		}
		shuffleArray(nearSnake);
		shuffleArray(others);
		const queues: Array<Array<Place>> = [nearSnake, others];
		for (const q of queues) {
			while (baseCount < targetBase && q.length > 0) {
				const [z, xx, yy] = q.pop()!;
				if ((xx % 2 === 0) && (yy % 2 === 0) && !blocksOverlap(present, 0, xx, yy)) {
					present.add(key(z, xx, yy));
					baseCount++;
				}
			}
		}
	}

	// Final base mapping
	const finalBase: Mapping = [];
	for (const yy of ys) for (const xx of xs) if (present.has(key(0, xx, yy))) finalBase.push([0, xx, yy]);
	return finalBase;
}

function generateBaseLayerChecker(minTarget: number, maxTarget: number, xMax: number, yMax: number): Mapping {
	const present = new Set<string>();
	const mapping: Mapping = [];

	// Use step of 1 for both x and y for fine granularity
	const xs: Array<number> = [];
	for (let x = 0; x <= xMax; x += 1) {
		xs.push(x);
	}
	const ys: Array<number> = [];
	for (let y = 0; y <= yMax; y += 1) {
		ys.push(y);
	}

	// start with a checkerboard-like base (no overlapping 2x2 on same z)
	for (const y of ys) {
		for (const x of xs) {
			if ((x % 2 !== 0) || (y % 2 !== 0)) {
				continue;
			}
			const k = key(0, x, y);
			present.add(k);
			mapping.push([0, x, y]);
		}
	}

	// carve side margins randomly to avoid full rectangle feel
	const leftCut = Math.random() < 0.5 ? 0 : randChoice([0, 0, 2, 2, 4]);
	const rightCut = Math.random() < 0.5 ? 0 : randChoice([0, 0, 2, 2, 4]);
	const topCut = Math.random() < 0.5 ? 0 : randChoice([0, 2, 2, 4]);
	const bottomCut = Math.random() < 0.5 ? 0 : randChoice([0, 2, 2, 4]);

	for (const y of ys) {
		for (const x of xs) {
			if (x < leftCut || x > xMax - rightCut || y < topCut || y > yMax - bottomCut) {
				const k = key(0, x, y);
				if (present.delete(k)) {
					// removed
				}
			}
		}
	}

	// punch random holes inside (more holes to thin base)
	punchHoles(present, 0, xs, ys, 6, 32);

	// rebuild mapping array for base z=0
	const mapping0: Mapping = [];
	for (const y of ys) for (const x of xs) {
		const k0 = key(0, x, y);
		if (present.has(k0)) mapping0.push([0, x, y]);
	}

	// ensure not too few or too many in base; adjust by removing/adding randomly
	let baseCount = mapping0.length;
	const targetBase = Math.min(Math.max(minTarget, Math.floor(baseCount * 0.45)), maxTarget);
	if (baseCount > targetBase) {
		const arrayCopy = shuffleArray([...mapping0]);
		while (baseCount > targetBase && arrayCopy.length > 0) {
			const p = arrayCopy.pop()!;
			const k = key(0, p[1], p[2]);
			if (present.delete(k)) baseCount--;
		}
	} else if (baseCount < targetBase) {
		const candidates: Array<Place> = [];
		for (const y of ys) for (const x of xs) if (!present.has(key(0, x, y))) candidates.push([0, x, y]);
		shuffleArray(candidates);
		while (baseCount < targetBase && candidates.length > 0) {
			const [z, x, y] = candidates.pop()!;
			// honor no-overlap rule on z=0
			if (!blocksOverlap(present, 0, x, y)) {
				present.add(key(z, x, y));
				baseCount++;
			}
		}
	}

	// return consolidated
	const baseMapping: Mapping = [];
	for (const y of ys) for (const x of xs) if (present.has(key(0, x, y))) baseMapping.push([0, x, y]);
	return baseMapping;
}

function mirrorBaseLayer(symmetricX: boolean, symmetricY: boolean, baseLayer: Mapping): Mapping {
	if ((!symmetricX && !symmetricY) || baseLayer.length === 0) {
		return baseLayer;
	}

	const usedX = Math.max(...baseLayer.map(p => p[1]));
	const usedY = Math.max(...baseLayer.map(p => p[2]));

	const spaceX = Math.min(4, X_MAX - (usedX * 2));
	const spaceY = Math.min(4, Y_MAX - (usedY * 2));

	const xMax = usedX * 2 + Math.floor(Math.random() * spaceX) + 2;
	const yMax = usedY * 2 + Math.floor(Math.random() * spaceY) + 2;

	const mirrorX = (x: number) => xMax - x;
	const mirrorY = (y: number) => yMax - y;

	let mapping: Mapping = [...baseLayer];

	let mirrored: Mapping = [];
	if (symmetricX) {
		for (const [z, x, y] of mapping) {
			const mx = mirrorX(x);
			if (mx === x) continue; // centerline, nothing to add
			mirrored.push([z, mx, y]);
		}
		mapping = [...mapping, ...mirrored];
	}

	mirrored = [];
	if (symmetricY) {
		for (const [z, x, y] of mapping) {
			const my = mirrorY(y);
			if (my === y) continue; // centerline, nothing to add
			mirrored.push([z, x, my]);
		}
		mapping = [...mapping, ...mirrored];
	}

	return mapping;
}

function generateBaseLayer(symmetricX: boolean, symmetricY: boolean, mode: string): Mapping {
	// symmetry factor for base density
	const both = symmetricX && symmetricY;
	const either = (symmetricX && !symmetricY) || (!symmetricX && symmetricY);
	const factor = both ? 0.3 : (either ? 0.5 : 1);
	if (mode === 'checker') {
		const baseMin = 70;
		const baseMax = 120;
		const minTarget = Math.max(1, Math.floor(baseMin * factor));
		const maxTarget = Math.max(minTarget, Math.floor(baseMax * factor));
		// choose extents favoring mid-size boards
		const xRangeMin = symmetricX ? 7 : 14;
		const xRangeMax = symmetricX ? Math.floor(X_MAX / 2) : X_MAX;
		const xMax = Math.floor(Math.random() * (xRangeMax - xRangeMin + 1)) + xRangeMin;
		const yRangeMin = symmetricY ? 6 : 12;
		const yRangeMax = symmetricY ? Math.floor(Y_MAX / 2) : Y_MAX;
		const yMax = Math.floor(Math.random() * (yRangeMax - yRangeMin + 1)) + yRangeMin;
		return mirrorBaseLayer(symmetricX, symmetricY, generateBaseLayerChecker(minTarget, maxTarget, xMax, yMax));
	}
	if (mode === 'lines') {
		const baseMin = 60;
		const baseMax = 100;
		const minTarget = Math.max(1, Math.floor(baseMin * factor));
		const maxTarget = Math.max(minTarget, Math.floor(baseMax * factor));
		const xMax = symmetricX ? Math.floor(X_MAX / 2) : X_MAX;
		const yMax = symmetricY ? Math.floor(Y_MAX / 2) : Y_MAX;
		return mirrorBaseLayer(symmetricX, symmetricY, generateBaseLayerLines(minTarget, maxTarget, xMax, yMax));
	}
	throw new Error('Invalid mode');
}

function growLevel(current: Mapping, z: number, symmetricX: boolean, symmetricY: boolean): Mapping {
	// If already at target, return early
	if (current.length >= TARGET_COUNT) return current;

	// Determine scan window from layer z-1 extents
	let minX = X_MAX;
	let maxX = 0;
	let minY = Y_MAX;
	let maxY = 0;
	for (const [zz, xx, yy] of current) {
		if (zz === z - 1) {
			minX = Math.min(minX, xx);
			maxX = Math.max(maxX, xx);
			minY = Math.min(minY, yy);
			maxY = Math.max(maxY, yy);
		}
	}
	if (minX > maxX || minY > maxY) return current; // no layer below to support this level

	minX = Math.max(0, minX - 2);
	maxX = Math.min(X_MAX, maxX + 2);
	minY = Math.max(0, minY - 2);
	maxY = Math.min(Y_MAX, maxY + 2);

	// Build a set of present positions for fast queries
	const present = new Set<string>(current.map(p => key(p[0], p[1], p[2])));

	// Collect candidate positions, bucketed by support type to encourage bridges
	const bridgeLarge: Array<[number, number]> = [];
	const bridgeSmall: Array<[number, number]> = [];
	const direct: Array<[number, number]> = [];
	const overhangs: Array<[number, number]> = [];
	const zb = z - 1;

	for (let y = minY; y <= maxY; y++) {
		for (let x = minX; x <= maxX; x++) {
			const kHere = key(z, x, y);
			if (present.has(kHere) || !inBounds(x, y, z)) continue;
			// classify support type using only info from below layer
			const hasDirect = present.has(key(zb, x, y));
			const hasSmall = present.has(key(zb, x - 1, y)) && present.has(key(zb, x + 1, y));
			const hasLarge =
				present.has(key(zb, x - 1, y - 1)) &&
				present.has(key(zb, x + 1, y - 1)) &&
				present.has(key(zb, x - 1, y + 1)) &&
				present.has(key(zb, x + 1, y + 1));
			if (!(hasDirect || hasSmall || hasLarge)) continue;
			// Full validation later via tryAdd; roughly split into buckets now
			if (hasLarge) bridgeLarge.push([x, y]);
			else if (hasSmall) bridgeSmall.push([x, y]);
			else if (hasDirect) direct.push([x, y]);
		}
	}

	// A little randomness: small chance to propose supported orthogonal offsets around direct supports
	// to avoid too rigid stacks, but still validated by isSupported and blocksOverlap.
	if (Math.random() < 0.25) {
		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				if (!present.has(key(zb, x, y))) continue;
				const directions: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
				const [dx, dy] = randChoice(directions);
				const ox = x + dx;
				const oy = y + dy;
				if (!inBounds(ox, oy, z)) continue;
				const kh = key(z, ox, oy);
				if (present.has(kh)) continue;
				// isSupported will ensure it’s valid, we just enqueue
				overhangs.push([ox, oy]);
			}
		}
	}

	// Define a per-level addition cap: leave some tiles for upper levels
	const remaining = TARGET_COUNT - current.length;
	// For reliability in tests, allow this level to place up to remaining tiles when candidates exist
	let levelBudget = Math.trunc(Math.random() * remaining);
	// enforce even levelBudget
	levelBudget -= (levelBudget % 2);
	levelBudget = Math.max(levelBudget, 2);
	let placed = 0;
	const xsAll = current.map(p => p[1]);
	const ysAll = current.map(p => p[2]);
	const minBoardX = xsAll.length > 0 ? Math.min(...xsAll) : 0;
	const maxBoardX = xsAll.length > 0 ? Math.max(...xsAll) : X_MAX;
	const minBoardY = ysAll.length > 0 ? Math.min(...ysAll) : 0;
	const maxBoardY = ysAll.length > 0 ? Math.max(...ysAll) : Y_MAX;
	const midX = (minBoardX + maxBoardX) / 2;
	const midY = (minBoardY + maxBoardY) / 2;
	const mirrorX = (x: number) => Math.round(2 * midX - x);
	const mirrorY = (y: number) => Math.round(2 * midY - y);

	const result: Mapping = [...current];

	// Process buckets in priority order without shuffling/concatenation to reduce overhead
	const processBucket = (bucket: Array<[number, number]>) => {
		for (const pos of bucket) {
			if (placed >= levelBudget || result.length >= TARGET_COUNT) return;
			const x = pos[0];
			const y = pos[1];
			if (!tryAdd(present, result, z, x, y)) continue;
			placed++;
			if (symmetricX || symmetricY) {
				const mx = mirrorX(x);
				const my = mirrorY(y);
				if (symmetricX && mx !== x) tryAdd(present, result, z, mx, y);
				if (symmetricY && my !== y) tryAdd(present, result, z, x, my);
				if (symmetricX && symmetricY && ((mx !== x) || (my !== y))) tryAdd(present, result, z, mx, my);
			}
		}
	};

	processBucket(bridgeLarge);
	processBucket(bridgeSmall);
	processBucket(direct);
	processBucket(overhangs);
	return result;
}

function fillLayout(baseLayer: Mapping, symmetricX: boolean, symmetricY: boolean): Mapping {
	let mapping = [...baseLayer];
	let passes = 0;
	while (mapping.length < TARGET_COUNT && passes < 50) {
		passes++;
		const before = mapping.length;
		for (let z = 1; z <= Z_MAX; z++) {
			mapping = growLevel(mapping, z, symmetricX, symmetricY);
			if (mapping.length >= TARGET_COUNT) break;
		}
		if (mapping.length === before) break;
	}
	return mapping;
}

export function generateRandomMappingRaw(symmetricX: boolean, symmetricY: boolean, mode: string): Mapping {
	const mapping = generateBaseLayer(symmetricX, symmetricY, mode);
	for (let index = 0; index < 20; index++) {
		const filled = fillLayout(mapping, symmetricX, symmetricY);
		if (filled.length === TARGET_COUNT) {
			return filled;
		}
	}
	return [];
}

function isOdd(num: number): boolean {
	return num % 2 !== 0;
}

export type RandomMode = 'random' | 'checker' | 'lines';
export type RandomSymmetry = 'random' | 'true' | 'false';

export function generateRandomMapping(
	randomSymmetryX: RandomSymmetry, randomSymmetryY: RandomSymmetry, randomMode: RandomMode
): Mapping {
	const symmetricX = randomSymmetryX === 'random' ? Math.random() < 0.5 : (randomSymmetryX === 'true');
	const symmetricY = randomSymmetryY === 'random' ? Math.random() < 0.5 : (randomSymmetryY === 'true');
	const mode = randomMode === 'random' ? (Math.random() < 0.5 ? 'lines' : 'checker') : randomMode;
	let mapping: Mapping = [];
	let countTries = 0;
	while (mapping.length === 0 || isOdd(mapping.length)) {
		mapping = generateRandomMappingRaw(symmetricX, symmetricY, mode);
		countTries++;
		if (countTries > 100) {
			return [];
		}
	}
	return optimizeMapping(mapping);
}
