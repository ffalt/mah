import type { Mapping, Place } from '../types';
import { blocksOverlap, inBounds, key, randChoice, randInt, shuffleArray, buildUnitGrids, buildMappingFromSetZ0 } from './utilities';
import type { BaseLayerOptions } from './consts';

function addBaseLine(present: Set<string>, mapping: Mapping, snakeKeys: Set<string>, x: number, y: number, markSnake = false): boolean {
	if ((x % 2 !== 0) || (y % 2 !== 0)) {
		return false;
	}
	if (!inBounds(x, y, 0)) {
		return false;
	}
	const k0 = key(0, x, y);
	if (present.has(k0)) {
		return false;
	}
	if (blocksOverlap(present, 0, x, y)) {
		return false;
	}
	present.add(k0);
	mapping.push([0, x, y]);
	if (markSnake) {
		snakeKeys.add(k0);
	}
	return true;
}

// eslint-disable-next-line complexity
export function generateBaseLayerLines({ minTarget, maxTarget, xMax, yMax }: BaseLayerOptions): Mapping {
	// Build exactly one continuous snake-like line on z=0.
	// Self-crossing in terms of path is conceptually allowed, but we still enforce the 3x3 no-overlap
	// rule for placements, so the snake will meander without adjacent placements on the same level.

	const present = new Set<string>();
	const mapping: Mapping = [];
	const snakeKeys = new Set<string>(); // track tiles that belong to the snake so we don't delete them later
	// Use step of 1 for global grid but place only on even-even to respect no-overlap spacing naturally.
	const { xs, ys } = buildUnitGrids(xMax, yMax, 1);

	// Start near the center on even-even
	let sx = Math.floor(xMax / 2);
	let sy = Math.floor(yMax / 2);
	sx -= sx % 2;
	sy -= sy % 2;
	if (!inBounds(sx, sy, 0)) {
		sx = 0;
		sy = 0;
	}
	addBaseLine(present, mapping, snakeKeys, sx, sy, true);

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
		if (Math.random() < wobble) {
			tryDirections = shuffleArray(tryDirections);
		}
		// 20% of the time, prefer an orthogonal first to force zig-zagging
		if (Math.random() < 0.2) {
			tryDirections = [...shuffleArray([...orth]), cont, rev];
		}
		let moved = false;
		for (const [dx1, dy1] of tryDirections) {
			const nx1 = x + dx1 * 2;
			const ny1 = y + dy1 * 2;
			if (inBounds(nx1, ny1, 0) && addBaseLine(present, mapping, snakeKeys, nx1, ny1, true)) {
				x = nx1;
				y = ny1;
				direction = [dx1, dy1];
				moved = true;
				break;
			}
		}
		if (moved) {
			continue;
		}
		// If blocked, attempt a tiny zig-zag burst: try two-step pattern (turn then forward), but place only the first step
		const stepDirections: Array<[number, number]> = shuffleArray([[1, 0], [-1, 0], [0, 1], [0, -1]]);
		let placed = false;
		for (const [dxA, dyA] of stepDirections) {
			const ax = x + dxA * 2;
			const ay = y + dyA * 2;
			if (!inBounds(ax, ay, 0) || blocksOverlap(present, 0, ax, ay) || present.has(key(0, ax, ay))) {
				continue;
			}
			if (addBaseLine(present, mapping, snakeKeys, ax, ay, true)) {
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
	for (const yy of ys) {
		for (const xx of xs) {
			if (xx < leftCut || xx > xMax - rightCut || yy < topCut || yy > yMax - bottomCut) {
				const k0 = key(0, xx, yy);
				// keep snake tiles intact to avoid holes in the line
				if (!snakeKeys.has(k0)) {
					present.delete(k0);
				}
			}
		}
	}

	// Build baseMapping
	const baseMapping: Mapping = buildMappingFromSetZ0(present, xMax, yMax, 1);

	// Normalize base density to a thin range to encourage upper layers
	let baseCount = baseMapping.length;
	const targetBase = Math.min(Math.max(minTarget, Math.floor(baseCount * 0.9)), maxTarget);
	if (baseCount > targetBase) {
		// Do not remove snake tiles; remove only non-snake to keep continuity
		const copy = shuffleArray([...baseMapping].filter(p => !snakeKeys.has(key(0, p[1], p[2]))));
		while (baseCount > targetBase && copy.length > 0) {
			const p = copy.pop()!;
			if (present.delete(key(0, p[1], p[2]))) {
				baseCount--;
			}
		}
	} else if (baseCount < targetBase) {
		// Prefer adding tiles adjacent to the snake to preserve a continuous line feel
		const nearSnake: Array<Place> = [];
		const others: Array<Place> = [];
		for (const yy of ys) {
			for (const xx of xs) {
				if (!present.has(key(0, xx, yy))) {
					const neighbors: Array<[number, number]> = [
						[xx - 2, yy], [xx + 2, yy], [xx, yy - 2], [xx, yy + 2]
					];
					const adjSnake = neighbors.some(([nx, ny]) => snakeKeys.has(key(0, nx, ny)));
					(adjSnake ? nearSnake : others).push([0, xx, yy]);
				}
			}
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
	for (const yy of ys) {
		for (const xx of xs) {
			if (present.has(key(0, xx, yy))) {
				finalBase.push([0, xx, yy]);
			}
		}
	}
	return finalBase;
}
