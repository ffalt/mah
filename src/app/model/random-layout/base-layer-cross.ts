import type { Mapping } from '../types';
import { generateBaseLayerWithShapes, shuffleArray } from './utilities';
import type { BaseLayerOptions } from './consts';

// Plus/cross shape within a bounding box of (w × h) tiles.
// w and h must be odd so the center is on an even-coordinate grid point.
export function crossCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const cx = x0 + Math.floor(w / 2) * 2;
	const cy = y0 + Math.floor(h / 2) * 2;
	const x1 = x0 + (w - 1) * 2;
	const y1 = y0 + (h - 1) * 2;
	const cells: Array<[number, number]> = [];
	for (let x = x0; x <= x1; x += 2) {
		cells.push([x, cy]);
	}
	for (let y = y0; y <= y1; y += 2) {
		if (y !== cy) {
			cells.push([cx, y]);
		}
	}
	return cells;
}

export function generateBaseLayerCross(options: BaseLayerOptions): Mapping {
	const allSizes: Array<[number, number]> = [];
	for (let w = 3; w <= 9; w += 2) {
		for (let h = 3; h <= 9; h += 2) {
			allSizes.push([w, h]);
		}
	}
	shuffleArray(allSizes);
	return generateBaseLayerWithShapes(allSizes, crossCells, options);
}
