import type { Mapping } from '../types';
import { type RandomBaseLayerMode, X_MAX, Y_MAX, Z_MAX } from './consts';

export function key(z: number, x: number, y: number): string {
	return `${z}|${x}|${y}`;
}

export function randInt(min: number, maxInclusive: number): number {
	return Math.floor(Math.random() * (maxInclusive - min + 1)) + min;
}

export function randChoice<T>(array: Array<T>): T {
	return array[Math.floor(Math.random() * array.length)];
}

export function shuffleArray<T>(array: Array<T>): Array<T> {
	for (let index = array.length - 1; index > 0; index--) {
		const index2 = Math.floor(Math.random() * (index + 1));
		[array[index], array[index2]] = [array[index2], array[index]];
	}
	return array;
}

export function inBounds(x: number, y: number, z: number): boolean {
	return x >= 0 && x <= X_MAX && y >= 0 && y <= Y_MAX && z >= 0 && z <= Z_MAX;
}

export function blocksOverlap(present: Set<string>, z: number, x: number, y: number): boolean {
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
export function isSupported(present: Set<string>, z: number, x: number, y: number): boolean {
	if (z === 0) {
		return true;
	}
	const zb = z - 1;
	// 1) direct below
	if (present.has(key(zb, x, y))) {
		return true;
	}
	// 2) small bridge left+right
	if (present.has(key(zb, x - 1, y)) && present.has(key(zb, x + 1, y))) {
		return true;
	}
	// 3) large bridge four diagonals
	return (
		present.has(key(zb, x - 1, y - 1)) &&
		present.has(key(zb, x + 1, y - 1)) &&
		present.has(key(zb, x - 1, y + 1)) &&
		present.has(key(zb, x + 1, y + 1))
	);
}

// Try to add a tile to mapping with full validation
export function tryAdd(present: Set<string>, mapping: Mapping, z: number, x: number, y: number): boolean {
	if (!inBounds(x, y, z)) {
		return false;
	}
	const k = key(z, x, y);
	if (present.has(k)) {
		return false;
	}
	if (!isSupported(present, z, x, y)) {
		return false;
	}
	if (blocksOverlap(present, z, x, y)) {
		return false;
	}
	present.add(k);
	mapping.push([z, x, y]);
	return true;
}

export function isOdd(num: number): boolean {
	return num % 2 !== 0;
}

export function getRandomMode(): RandomBaseLayerMode {
	const modes: Array<RandomBaseLayerMode> = [
		'lines', 'lines', 'lines',
		'checker', 'checker',
		'areas', 'areas',
		'rings'
	];
	return randChoice(modes);
}

export function buildEvenAnchors(xMax: number, yMax: number): Array<[number, number]> {
	const anchors: Array<[number, number]> = [];
	for (let y = 0; y <= yMax; y += 2) {
		for (let x = 0; x <= xMax; x += 2) {
			anchors.push([x, y]);
		}
	}
	return anchors;
}

export function markBufferPoints(points: Array<[number, number]>, radius: number, blocked: Set<string>, z = 0): void {
	for (const [px, py] of points) {
		for (let dy = -radius; dy <= radius; dy++) {
			for (let dx = -radius; dx <= radius; dx++) {
				const bx = px + dx;
				const by = py + dy;
				if (!inBounds(bx, by, z)) {
					continue;
				}
				blocked.add(key(z, bx, by));
			}
		}
	}
}

export function buildMappingFromSetZ0(present: Set<string>, xMax: number, yMax: number, step = 2): Mapping {
	const result: Mapping = [];
	for (let y = 0; y <= yMax; y += step) {
		for (let x = 0; x <= xMax; x += step) {
			if (present.has(key(0, x, y))) {
				result.push([0, x, y]);
			}
		}
	}
	return result;
}

export function buildUnitGrids(xMax: number, yMax: number, step = 1): { xs: Array<number>; ys: Array<number> } {
	const xs: Array<number> = [];
	for (let x = 0; x <= xMax; x += step) {
		xs.push(x);
	}
	const ys: Array<number> = [];
	for (let y = 0; y <= yMax; y += step) {
		ys.push(y);
	}
	return { xs, ys };
}

export function placeSizesGeneric(
	startTotal: number,
	sizes: Array<[number, number]>,
	anchors: Array<[number, number]>,
	minTarget: number,
	maxTarget: number,
	tryPlace: (x0: number, y0: number, w: number, h: number) => number
): number {
	let total = startTotal;
	for (const [w, h] of sizes) {
		if (total >= maxTarget) {
			break;
		}
		for (const [x0, y0] of anchors) {
			if (total >= maxTarget) {
				break;
			}
			const added = tryPlace(x0, y0, w, h);
			if (added > 0) {
				total += added;
				if (total >= minTarget && total <= maxTarget) {
					break;
				}
			}
		}
		if (total >= minTarget && total <= maxTarget) {
			break;
		}
	}
	return total;
}
