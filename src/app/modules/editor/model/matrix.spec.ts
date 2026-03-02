import { Matrix } from './matrix';
import type { Mapping } from '../../../model/types';

describe('Matrix', () => {
	let matrix: Matrix;

	beforeEach(() => {
		matrix = new Matrix();
	});

	describe('initialization', () => {
		it('should create an instance', () => {
			expect(matrix).toBeTruthy();
		});

		it('should initialize with default dimensions', () => {
			expect(matrix['levels']).toHaveLength(1);
			expect(matrix['levels'][0]).toHaveLength(2);
			expect(matrix['levels'][0][0]).toHaveLength(2);
		});
	});

	describe('inBounds', () => {
		it('should return false for empty levels array', () => {
			matrix.init(0, 0, 0);

			const result = matrix.inBounds(0, 0, 0);

			expect(result).toBe(false);
		});

		it('should return false when levels[0] is undefined', () => {
			matrix.init(0, 0, 0);

			const result = matrix.inBounds(0, 0, 0);

			expect(result).toBe(false);
		});

		it('should handle negative coordinates', () => {
			matrix.init(5, 5, 3);

			expect(matrix.inBounds(-1, 0, 0)).toBe(false);
			expect(matrix.inBounds(0, -1, 0)).toBe(false);
			expect(matrix.inBounds(0, 0, -1)).toBe(false);
		});

		it('should return true for valid coordinates within bounds', () => {
			matrix.init(10, 10, 3);

			expect(matrix.inBounds(0, 0, 0)).toBe(true);
			expect(matrix.inBounds(2, 9, 9)).toBe(true);
			expect(matrix.inBounds(1, 5, 5)).toBe(true);
		});

		it('should return false for coordinates beyond bounds', () => {
			matrix.init(10, 10, 3);

			expect(matrix.inBounds(3, 0, 0)).toBe(false);
			expect(matrix.inBounds(0, 10, 0)).toBe(false);
			expect(matrix.inBounds(0, 0, 10)).toBe(false);
		});

		it('should return false for z coordinate at boundary', () => {
			matrix.init(10, 10, 3);

			expect(matrix.inBounds(3, 0, 0)).toBe(false);
		});

		it('should handle partially initialized levels gracefully', () => {
			matrix.init(5, 5, 2);
			matrix['levels'][0] = null as never;

			const result = matrix.inBounds(0, 0, 0);

			expect(result).toBe(false);
		});
	});

	describe('isTile', () => {
		it('should return false for out of bounds coordinates', () => {
			matrix.init(5, 5, 2);

			expect(matrix.isTile(-1, 0, 0)).toBe(false);
			expect(matrix.isTile(5, 0, 0)).toBe(false);
		});

		it('should return false for unset tiles', () => {
			matrix.init(5, 5, 2);

			expect(matrix.isTile(0, 0, 0)).toBe(false);
		});

		it('should return true for set tiles', () => {
			matrix.init(5, 5, 2);
			matrix.setValue(0, 0, 0, 1);

			expect(matrix.isTile(0, 0, 0)).toBe(true);
		});

		it('should return true for tiles with any positive value', () => {
			matrix.init(5, 5, 2);
			matrix.setValue(1, 2, 3, 5);

			expect(matrix.isTile(1, 2, 3)).toBe(true);
		});
	});

	describe('isTilePosInvalid', () => {
		it('should return true for out of bounds coordinates', () => {
			matrix.init(5, 5, 2);

			expect(matrix.isTilePosInvalid(-1, 0, 0)).toBe(true);
			expect(matrix.isTilePosInvalid(5, 0, 0)).toBe(true);
		});

		it('should return true for empty levels', () => {
			matrix.init(0, 0, 0);

			const result = matrix.isTilePosInvalid(0, 0, 0);

			expect(result).toBe(true);
		});

		it('should return true when there is no right column', () => {
			matrix.init(5, 5, 2);

			expect(matrix.isTilePosInvalid(0, 4, 0)).toBe(true);
		});

		it('should return true when position is at last row', () => {
			matrix.init(5, 5, 2);

			expect(matrix.isTilePosInvalid(0, 0, 4)).toBe(true);
		});

		it('should return false for valid empty position without surrounding tiles', () => {
			matrix.init(5, 5, 2);

			const result = matrix.isTilePosInvalid(0, 1, 1);

			expect(result).toBe(false);
		});

		it('should return true when surrounded by tiles', () => {
			matrix.init(5, 5, 2);
			matrix.setValue(0, 2, 2, 1);
			matrix.setValue(0, 1, 2, 1);
			matrix.setValue(0, 1, 1, 1);
			matrix.setValue(0, 2, 1, 1);

			const result = matrix.isTilePosInvalid(0, 1, 1);

			expect(result).toBe(true);
		});

		it('should return true when there is any adjacent tile', () => {
			matrix.init(5, 5, 2);
			matrix.setValue(0, 2, 3, 1);

			const result = matrix.isTilePosInvalid(0, 1, 2);

			expect(result).toBe(true);
		});
	});

	describe('isTilePosBlocked', () => {
		it('should return true when tile below exists', () => {
			matrix.init(5, 5, 2);
			matrix.setValue(0, 0, 0, 1);

			expect(matrix.isTilePosBlocked(0, 0, 1)).toBe(true);
		});

		it('should return true when tile to left exists', () => {
			matrix.init(5, 5, 2);
			matrix.setValue(0, 0, 0, 1);

			expect(matrix.isTilePosBlocked(0, 1, 0)).toBe(true);
		});

		it('should return true when tile diagonally below-left exists', () => {
			matrix.init(5, 5, 2);
			matrix.setValue(0, 0, 0, 1);

			expect(matrix.isTilePosBlocked(0, 1, 1)).toBe(true);
		});

		it('should return false when no blocking tiles exist', () => {
			matrix.init(5, 5, 2);

			expect(matrix.isTilePosBlocked(0, 2, 2)).toBe(false);
		});
	});

	describe('get and setValue', () => {
		it('should get default value for unset tile', () => {
			matrix.init(5, 5, 2);

			expect(matrix.get(0, 0, 0)).toBe(0);
		});

		it('should set and get tile value', () => {
			matrix.init(5, 5, 2);
			matrix.setValue(0, 0, 0, 42);

			expect(matrix.get(0, 0, 0)).toBe(42);
		});

		it('should handle multiple levels', () => {
			matrix.init(5, 5, 3);
			matrix.setValue(0, 1, 1, 1);
			matrix.setValue(1, 1, 1, 2);
			matrix.setValue(2, 1, 1, 3);

			expect(matrix.get(0, 1, 1)).toBe(1);
			expect(matrix.get(1, 1, 1)).toBe(2);
			expect(matrix.get(2, 1, 1)).toBe(3);
		});
	});

	describe('applyMapping', () => {
		it('should initialize matrix from mapping', () => {
			const mapping: Mapping = [
				[0, 0, 0],
				[0, 1, 0],
				[0, 0, 1]
			];

			matrix.applyMapping(mapping, 1, 0, 0);

			expect(matrix.isTile(0, 0, 0)).toBe(true);
			expect(matrix.isTile(0, 1, 0)).toBe(true);
			expect(matrix.isTile(0, 0, 1)).toBe(true);
		});

		it('should respect minimum level bounds', () => {
			const mapping: Mapping = [
				[0, 0, 0],
				[1, 1, 1]
			];

			matrix.applyMapping(mapping, 3, 5, 5);

			expect(matrix['levels'].length).toBeGreaterThanOrEqual(3);
		});

		it('should handle empty mapping', () => {
			const mapping: Mapping = [];

			expect(() => {
				matrix.applyMapping(mapping, 1, 2, 3);
			}).not.toThrow();
		});
	});
});
