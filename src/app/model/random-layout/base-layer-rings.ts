import type { Mapping } from '../types';
import { blocksOverlap, inBounds, key, shuffleArray, buildEvenAnchors, markBufferPoints, placeSizesGeneric, buildMappingFromSetZ0 } from './utilities';
import { BaseLayerOptions } from './consts';

function ringPerimeter(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const x1 = x0 + (w - 1) * 2;
	const y1 = y0 + (h - 1) * 2;
	const per: Array<[number, number]> = [];
	for (let x = x0; x <= x1; x += 2) {
		per.push([x, y0]);
	}
	for (let y = y0 + 2; y <= y1; y += 2) {
		per.push([x1, y]);
	}
	for (let x = x1 - 2; x >= x0; x -= 2) {
		per.push([x, y1]);
	}
	for (let y = y1 - 2; y > y0; y -= 2) {
		per.push([x0, y]);
	}
	return per;
}

function canPlace(x0: number, y0: number, w: number, h: number, occupied: Set<string>, blocked: Set<string>, usedSizes: Set<string>): boolean {
	const sizeKey = `${w}x${h}`;
	if (usedSizes.has(sizeKey)) {
		return false;
	}
	const x1 = x0 + (w - 1) * 2;
	const y1 = y0 + (h - 1) * 2;
	if (!inBounds(x1, y1, 0)) {
		return false;
	}
	const per = ringPerimeter(x0, y0, w, h);
	for (const [x, y] of per) {
		if ((x % 2 !== 0) || (y % 2 !== 0)) {
			return false;
		}
		if (!inBounds(x, y, 0)) {
			return false;
		}
		const k = key(0, x, y);
		if (occupied.has(k)) {
			return false;
		}
		if (blocked.has(k)) {
			return false;
		}
		if (blocksOverlap(occupied, 0, x, y)) {
			return false;
		}
	}
	return true;
}

function place(x0: number, y0: number, w: number, h: number, occupied: Set<string>, blocked: Set<string>, usedSizes: Set<string>): number {
	const per = ringPerimeter(x0, y0, w, h);
	for (const [x, y] of per) {
		occupied.add(key(0, x, y));
	}
	markBufferPoints(per, 2, blocked, 0);
	usedSizes.add(`${w}x${h}`);
	return per.length;
}

export function generateBaseLayerRings({ minTarget, maxTarget, xMax, yMax }: BaseLayerOptions): Mapping {
	// Random placement of hollow rectangular rings on z=0 with spacing 2 and unique sizes per layer.
	// - Ring outer width/height in [3..8]
	// - Borders only, continuous per ring
	// - Spacing: at least 2 cells empty between different rings (Chebyshev radius 2)
	// - Use even-even grid to cooperate with blocksOverlap safety
	// - Do not place two rings with identical (w,h)

	const occupied = new Set<string>();
	const blocked = new Set<string>();
	const usedSizes = new Set<string>();

	const allSizes: Array<[number, number]> = [];
	for (let w = 3; w <= 8; w++) {
		for (let h = 3; h <= 8; h++) {
			allSizes.push([w, h]);
		}
	}
	// Randomize size order; we will still enforce uniqueness by usedSizes
	shuffleArray(allSizes);

	// Build randomized list of even-even anchor positions within bounds
	const anchors = buildEvenAnchors(xMax, yMax);
	shuffleArray(anchors);

	let total = 0;
	// Phase 1: try randomized sizes against randomized anchors
	total = placeSizesGeneric(total, allSizes, anchors, minTarget, maxTarget, (x0, y0, w, h) =>
		canPlace(x0, y0, w, h, occupied, blocked, usedSizes) ? place(x0, y0, w, h, occupied, blocked, usedSizes) : 0
	);

	// Phase 2: if still below minTarget, try remaining unused sizes in a fresh random order and reshuffled anchors
	if (total < minTarget) {
		const remainingSizes = allSizes.filter(([w, h]) => !usedSizes.has(`${w}x${h}`));
		shuffleArray(remainingSizes);
		shuffleArray(anchors);
		total = placeSizesGeneric(total, remainingSizes, anchors, minTarget, maxTarget, (x0, y0, w, h) =>
			canPlace(x0, y0, w, h, occupied, blocked, usedSizes) ? place(x0, y0, w, h, occupied, blocked, usedSizes) : 0
		);
	}

	// Phase 3: fill remaining empty spaces with rings too, up to maxTarget.
	// Keep trying any remaining unused sizes; if all sizes are used and still room, allow reuse of sizes to pack gaps.
	if (total < maxTarget) {
		let progress = true;
		let allowReuse = false;
		while (progress && total < maxTarget) {
			progress = false;
			const sizePool: Array<[number, number]> =
				allowReuse ? [...allSizes] : allSizes.filter(([w, h]) => !usedSizes.has(`${w}x${h}`));
			if (sizePool.length === 0 && !allowReuse) {
				allowReuse = true; // all unique sizes exhausted; permit reuse to truly fill spaces
				continue;
			}
			shuffleArray(sizePool);
			shuffleArray(anchors);
			total = placeSizesGeneric(total, sizePool, anchors, minTarget, maxTarget, (x0, y0, w, h) => {
				if (!canPlace(x0, y0, w, h, occupied, blocked, usedSizes)) {
					return 0;
				}
				const added = place(x0, y0, w, h, occupied, blocked, usedSizes);
				if (added > 0) {
					progress = true;
				}
				return added;
			});
		}
	}

	// Build mapping in y,x order
	return buildMappingFromSetZ0(occupied, xMax, yMax, 2);
}
