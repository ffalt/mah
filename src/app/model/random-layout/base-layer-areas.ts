import type { Mapping } from '../types';
import { shuffleArray, buildEvenAnchors, placeSizesGeneric, buildMappingFromSetZ0, canPlace, place } from './utilities';
import type { BaseLayerOptions } from './consts';

function areaCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const x1 = x0 + (w - 1) * 2;
	const y1 = y0 + (h - 1) * 2;
	const cells: Array<[number, number]> = [];
	for (let y = y0; y <= y1; y += 2) {
		for (let x = x0; x <= x1; x += 2) {
			cells.push([x, y]);
		}
	}
	return cells;
}

export function generateBaseLayerAreas({ minTarget, maxTarget, xMax, yMax }: BaseLayerOptions): Mapping {
	// Random placement of filled rectangular areas on z=0 with spacing 2 and unique sizes per layer.
	// - Area outer width/height in [3..4]
	// - Filled areas (not hollow)
	// - Spacing: at least 2 cells empty between different areas (Chebyshev radius 2)
	// - Use even-even grid to cooperate with blocksOverlap safety
	// - Do not place two areas with identical (w,h) within the same base layer

	const occupied = new Set<string>();
	const blocked = new Set<string>();
	const usedSizes = new Set<string>();

	const allSizes: Array<[number, number]> = [];
	for (let w = 2; w <= 5; w++) {
		for (let h = 2; h <= 5; h++) {
			allSizes.push([w, h]);
		}
	}
	shuffleArray(allSizes);

	// Build a randomized list of even-even anchor positions within bounds
	const anchors = buildEvenAnchors(xMax, yMax);
	shuffleArray(anchors);

	// Phase 1: randomized sizes against randomized anchors
	let total = placeSizesGeneric(0, allSizes, anchors, minTarget, maxTarget, (x0, y0, w, h) =>
		canPlace(x0, y0, w, h, occupied, blocked, usedSizes, areaCells) ? place(x0, y0, w, h, occupied, blocked, usedSizes, areaCells) : 0
	);

	// Phase 2: if still below minTarget, try remaining unused sizes (reshuffle anchors and sizes)
	if (total < minTarget) {
		const remainingSizes = allSizes.filter(([w, h]) => !usedSizes.has(`${w}x${h}`));
		shuffleArray(remainingSizes);
		shuffleArray(anchors);
		total = placeSizesGeneric(total, remainingSizes, anchors, minTarget, maxTarget, (x0, y0, w, h) =>
			canPlace(x0, y0, w, h, occupied, blocked, usedSizes, areaCells) ? place(x0, y0, w, h, occupied, blocked, usedSizes, areaCells) : 0
		);
	}

	// Phase 3: fill remaining empty spaces with areas too, up to maxTarget. Allow size reuse after unique exhausted.
	if (total < maxTarget) {
		let progress = true;
		let allowReuse = false;
		while (progress && total < maxTarget) {
			progress = false;
			const sizePool: Array<[number, number]> =
				allowReuse ? [...allSizes] : allSizes.filter(([w, h]) => !usedSizes.has(`${w}x${h}`));
			if (sizePool.length === 0 && !allowReuse) {
				allowReuse = true;
				continue;
			}
			shuffleArray(sizePool);
			shuffleArray(anchors);
			total = placeSizesGeneric(total, sizePool, anchors, minTarget, maxTarget, (x0, y0, w, h) => {
				if (!canPlace(x0, y0, w, h, occupied, blocked, usedSizes, areaCells)) {
					return 0;
				}
				const added = place(x0, y0, w, h, occupied, blocked, usedSizes, areaCells);
				if (added > 0) {
					progress = true;
				}
				return added;
			});
		}
	}

	// Build mapping in y,x order (even-even)
	return buildMappingFromSetZ0(occupied, xMax, yMax, 2);
}
