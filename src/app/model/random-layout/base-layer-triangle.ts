import type { Mapping } from '../types';
import { generateBaseLayerWithShapes, randInt, shuffleArray } from './utilities';
import type { BaseLayerOptions } from './consts';

// Right triangle in one of four orientations. w and h are tile counts.
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
function triangleRow(orientation: number, row: number, w: number, h: number): { count: number; startCol: number } {
	switch (orientation) {
		case 0: {
			const count = Math.max(1, Math.round(w * (row + 1) / h));
			return { count, startCol: 0 };
		}
		case 1: {
			const count = Math.max(1, Math.round(w * (row + 1) / h));
			return { count, startCol: w - count };
		}
		case 2: {
			const count = Math.max(1, Math.round(w * (h - row) / h));
			return { count, startCol: 0 };
		}
		default: {
			const count = Math.max(1, Math.round(w * (h - row) / h));
			return { count, startCol: w - count };
		}
	}
}

export function triangleCells(x0: number, y0: number, w: number, h: number): Array<[number, number]> {
	const orientation = randInt(0, 3);
	const cells: Array<[number, number]> = [];
	for (let row = 0; row < h; row++) {
		const y = y0 + row * 2;
		const { count, startCol } = triangleRow(orientation, row, w, h);
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
	return generateBaseLayerWithShapes(allSizes, (x0, y0, w, h) => triangleCells(x0, y0, w, h), options, 4);
}
