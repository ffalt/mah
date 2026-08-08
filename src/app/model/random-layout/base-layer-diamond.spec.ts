import { afterEach, describe, expect, it, vi } from 'vitest';
import { diamondCells, generateBaseLayerDiamond } from './base-layer-diamond';

// diamondCells dispatches on rng() < 0.5, and rng() defaults to Math.random
const OUTLINE = 0.1;
const FILLED = 0.9;

function cellsWith(draw: number, w: number, h: number): Array<[number, number]> {
	vi.spyOn(Math, 'random').mockReturnValue(draw);
	const cells = diamondCells(0, 0, w, h);
	vi.restoreAllMocks();
	return cells;
}

describe('diamondCells', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	// a zero vertical radius made `Math.abs(dyStep) / ry` evaluate 0 / 0, so every cell
	// came out with NaN coordinates
	for (const [name, draw] of [['outline', OUTLINE], ['filled', FILLED]] as Array<[string, number]>) {
		it(`emits finite coordinates for a flat ${name} diamond`, () => {
			const cells = cellsWith(draw, 5, 1);

			expect(cells.length).toBeGreaterThan(0);
			for (const [x, y] of cells) {
				expect(Number.isFinite(x)).toBe(true);
				expect(Number.isFinite(y)).toBe(true);
			}
		});

		it(`emits finite coordinates for a degenerate ${name} diamond`, () => {
			for (const [w, h] of [[1, 1], [0, 0], [1, 0], [0, 1], [3, 1]]) {
				for (const [x, y] of cellsWith(draw, w, h)) {
					expect(Number.isFinite(x)).toBe(true);
					expect(Number.isFinite(y)).toBe(true);
				}
			}
		});
	}

	it('treats a flat diamond as a single full-width row', () => {
		const cells = cellsWith(FILLED, 5, 1);

		expect(new Set(cells.map(cell => cell[1]))).toHaveLength(1);
		expect(cells.map(cell => cell[0]).sort((a, b) => a - b)).toEqual([0, 2, 4, 6, 8]);
	});

	it('keeps the normal diamond shape unchanged', () => {
		const cells = cellsWith(OUTLINE, 5, 5);

		expect(cells.length).toBeGreaterThan(0);
		for (const [x, y] of cells) {
			expect(Number.isFinite(x)).toBe(true);
			expect(Number.isFinite(y)).toBe(true);
			expect(x % 2).toBe(0);
			expect(y % 2).toBe(0);
		}
		// widest row sits at the vertical centre
		const centreRow = cells.filter(cell => cell[1] === 4);
		expect(centreRow.length).toBeGreaterThan(0);
	});
});

describe('generateBaseLayerDiamond', () => {
	it('produces a mapping of even, finite coordinates', () => {
		const mapping = generateBaseLayerDiamond({ minTarget: 20, maxTarget: 60, xMax: 36, yMax: 16 });

		expect(mapping.length).toBeGreaterThan(0);
		for (const [z, x, y] of mapping) {
			expect(Number.isFinite(x)).toBe(true);
			expect(Number.isFinite(y)).toBe(true);
			expect(z).toBe(0);
		}
	});
});
