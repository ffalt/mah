import type { Mapping } from '../types';
import { generateBaseLayerWithShapes, randInt, shuffleArray } from './utilities';
import type { BaseLayerOptions } from './consts';

// Right triangle in one of four orientations. w and h are tile counts (not pixels).
// All produced coordinates are multiples of 2 (even-grid).
//
//  0 = tip top-left      1 = tip top-right
//      X                     . . X
//      X X                   . X X
//      X X X                 X X X
//
//  2 = tip bottom-left   3 = tip bottom-right
//      X X X                 X X X
//      X X                   . X X
//      X                     . . X
//
// Orientation is fixed per call (not per cell) so that canPlace and place see the same shape.
export function triangleCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const orientation = randInt(0, 3);
	const cells: Array<[number, number]> = [];
	for (let row = 0; row < h; row++) {
		const y = y0 + row * 2;
		let count: number;
		let startCol: number;
		switch (orientation) {
			case 0: {
				count = Math.max(1, Math.round(w * (row + 1) / h));
				startCol = 0;
				break;
			}
			case 1: {
				count = Math.max(1, Math.round(w * (row + 1) / h));
				startCol = w - count;
				break;
			}
			case 2: {
				count = Math.max(1, Math.round(w * (h - row) / h));
				startCol = 0;
				break;
			}
			default: {
				count = Math.max(1, Math.round(w * (h - row) / h));
				startCol = w - count;
			}
		}
		for (let col = startCol; col < startCol + count; col++) {
			cells.push([x0 + col * 2, y]);
		}
	}
	return cells;
}

export function generateBaseLayerTriangle(options: BaseLayerOptions): Mapping {
	const allSizes: Array<[number, number]> = [];
	for (let w = 3; w <= 9; w++) {
		for (let h = 3; h <= 9; h++) {
			allSizes.push([w, h]);
		}
	}
	shuffleArray(allSizes);
	// bufferRadius=4 (vs default 2) so the hypotenuse void does not let adjacent shapes
	// sneak into the empty bounding-box corners.
	return generateBaseLayerWithShapes(allSizes, (x0, y0, w, h) => triangleCells(x0, y0, w, h), options, 4);
}
