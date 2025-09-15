/* eslint-disable complexity */

import type { Mapping } from '../types';
import { TARGET_COUNT, X_MAX, Y_MAX, Z_MAX } from './consts';
import { blocksOverlap, inBounds, isOdd, isSupported, key, randChoice, tryAdd } from './utilities';

function growLevel(current: Mapping, z: number, mirrorX: boolean, mirrorY: boolean): Mapping {
	// If already at target, return early
	if (current.length >= TARGET_COUNT) {
		return current;
	}

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
	if (minX > maxX || minY > maxY) {
		return current;
	} // no layer below to support this level

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
			if (present.has(kHere) || !inBounds(x, y, z)) {
				continue;
			}
			// classify support type using only info from below layer
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
			// Full validation later via tryAdd; roughly split into buckets now
			if (hasLarge) {
				bridgeLarge.push([x, y]);
			} else if (hasSmall) {
				bridgeSmall.push([x, y]);
			} else if (hasDirect) {
				direct.push([x, y]);
			}
		}
	}

	// A little randomness: small chance to propose supported orthogonal offsets around direct supports
	// to avoid too rigid stacks, but still validated by isSupported and blocksOverlap.
	if (Math.random() < 0.25) {
		for (let y = minY; y <= maxY; y++) {
			for (let x = minX; x <= maxX; x++) {
				if (!present.has(key(zb, x, y))) {
					continue;
				}
				const directions: Array<[number, number]> = [[-1, 0], [1, 0], [0, -1], [0, 1]];
				const [dx, dy] = randChoice(directions);
				const ox = x + dx;
				const oy = y + dy;
				if (!inBounds(ox, oy, z)) {
					continue;
				}
				const kh = key(z, ox, oy);
				if (present.has(kh)) {
					continue;
				}
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
	const mirX = (x: number) => Math.round(2 * midX - x);
	const mirY = (y: number) => Math.round(2 * midY - y);

	const result: Mapping = [...current];

	// Process buckets in priority order without shuffling/concatenation to reduce overhead
	const processBucket = (bucket: Array<[number, number]>) => {
		for (const pos of bucket) {
			if (placed >= levelBudget || result.length >= TARGET_COUNT) {
				return;
			}
			const x = pos[0];
			const y = pos[1];
			if (!tryAdd(present, result, z, x, y)) {
				continue;
			}
			placed++;
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
		}
	};

	processBucket(bridgeLarge);
	processBucket(bridgeSmall);
	processBucket(direct);
	processBucket(overhangs);
	return result;
}

export function fillLayout(baseLayer: Mapping, mirrorX: boolean, mirrorY: boolean): Mapping {
	let mapping = [...baseLayer];
	let passes = 0;
	while (mapping.length < TARGET_COUNT && passes < 50) {
		passes++;
		const before = mapping.length;
		for (let z = 1; z <= Z_MAX; z++) {
			mapping = growLevel(mapping, z, mirrorX, mirrorY);
			if (mapping.length >= TARGET_COUNT) {
				break;
			}
		}
		// Hard cap: never exceed TARGET_COUNT
		if (mapping.length > TARGET_COUNT) {
			mapping = mapping.slice(0, TARGET_COUNT);
		}
		if (mapping.length === before) {
			break;
		}
	}
	// Final fill phase: fill in randomized order to avoid stripes; respect symmetry where possible
	if (mapping.length < TARGET_COUNT) {
		const present = new Set<string>(mapping.map(p => key(p[0], p[1], p[2])));
		// Determine board extents to compute mirror centers similar to growLevel
		const xsAll = mapping.map(p => p[1]);
		const ysAll = mapping.map(p => p[2]);
		const minBoardX = xsAll.length > 0 ? Math.min(...xsAll) : 0;
		const maxBoardX = xsAll.length > 0 ? Math.max(...xsAll) : X_MAX;
		const minBoardY = ysAll.length > 0 ? Math.min(...ysAll) : 0;
		const maxBoardY = ysAll.length > 0 ? Math.max(...ysAll) : Y_MAX;
		const midX = (minBoardX + maxBoardX) / 2;
		const midY = (minBoardY + maxBoardY) / 2;
		const mirX = (x: number) => Math.round(2 * midX - x);
		const mirY = (y: number) => Math.round(2 * midY - y);

		// Build all candidate coordinates and shuffle their order within each z to diversify appearance
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
				// Shuffle candidates to avoid deterministic stripes
				for (let index = candidates.length - 1; index > 0; index--) {
					const index_ = Math.floor(Math.random() * (index + 1));
					[candidates[index], candidates[index_]] = [candidates[index_], candidates[index]];
				}
				// Try to place candidates, honoring symmetry by placing mirrored positions together when valid
				for (const [x, y] of candidates) {
					if (mapping.length >= TARGET_COUNT) {
						break;
					}
					const tryPlaceWithMirrors = (): boolean => {
						// Build the orbit of mirrors (unique positions only)
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
						// Validate all points in orbit before placing any to keep symmetry consistent
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
						// Ensure we have space
						if (mapping.length + orbit.length > TARGET_COUNT) {
							return false;
						}
						// Place all
						for (const [ox, oy] of orbit) {
							const kk = key(z, ox, oy);
							present.add(kk);
							mapping.push([z, ox, oy]);
						}
						return true;
					};
					if (tryPlaceWithMirrors()) {
						progress = true;
					}
				}
			}
		}
	}
	// Ensure even length mapping as required by pair-based gameplay
	// Also ensure the final length never exceeds TARGET_COUNT
	if (mapping.length > TARGET_COUNT) {
		mapping = mapping.slice(0, TARGET_COUNT);
	}
	if (isOdd(mapping.length)) {
		// Try to add exactly one more valid tile on the topmost possible level without breaking rules
		const present = new Set<string>(mapping.map(p => key(p[0], p[1], p[2])));
		let adjusted = false;
		// Determine extents to limit search
		let minX = X_MAX;
		let maxX = 0;
		let minY = Y_MAX;
		let maxY = 0;
		for (const [_z, xx, yy] of mapping) {
			minX = Math.min(minX, xx);
			maxX = Math.max(maxX, xx);
			minY = Math.min(minY, yy);
			maxY = Math.max(maxY, yy);
		}
		minX = Math.max(0, minX - 2);
		maxX = Math.min(X_MAX, maxX + 2);
		minY = Math.max(0, minY - 2);
		maxY = Math.min(Y_MAX, maxY + 2);
		// Try from top layer down to base to place one more tile
		for (let z = Z_MAX; z >= 0 && !adjusted; z--) {
			for (let y = minY; y <= maxY && !adjusted; y++) {
				for (let x = minX; x <= maxX; x++) {
					if (!inBounds(x, y, z)) {
						continue;
					}
					const k = key(z, x, y);
					if (present.has(k)) {
						continue;
					}
					// Validate support and overlap using existing helpers
					if (!isSupported(present, z, x, y)) {
						continue;
					}
					if (blocksOverlap(present, z, x, y)) {
						continue;
					}
					present.add(k);
					mapping.push([z, x, y]);
					adjusted = true;
					break;
				}
			}
		}
		// If we could not safely add one, remove the last placed tile (highest z, latest) to make it even
		if (!adjusted && mapping.length > 0) {
			// Prefer removing a tile that does not support any above tile
			// Build quick index of supports
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
			// Choose a removable tile: highest z with zero dependents
			let candidateIndex = -1;
			let bestZ = -1;
			for (let index = mapping.length - 1; index >= 0; index--) {
				const [z, x, y] = mapping[index];
				const k = key(z, x, y);
				if ((supports.get(k) || 0) === 0 && z >= bestZ) {
					candidateIndex = index;
					bestZ = z;
				}
			}
			if (candidateIndex >= 0) {
				mapping.splice(candidateIndex, 1);
			} else {
				// As a last resort, remove the last element
				mapping.pop();
			}
		}
	}
	return mapping;
}
