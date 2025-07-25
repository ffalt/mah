import { expandMapping, mappingToID, mappingBounds } from './mapping';
import type { CompactMapping, LoadLayout, Mapping } from './types';
import { readFileSync } from 'node:fs';
import { compactMapping } from '../modules/editor/model/import';

const filepath = './src/assets/data/boards.json';
const loadLayouts: Array<LoadLayout> = JSON.parse(readFileSync(filepath).toString());

describe('Mapping', () => {
	describe('expandMapping', () => {
		it('should expand a simple compact mapping', () => {
			const compactMapping: CompactMapping = [
				[0, [[0, 1]]]
			];

			const expanded = expandMapping(compactMapping);
			expect(expanded).toEqual([[0, 1, 0]]);
		});

		it('should expand a compact mapping with multiple rows', () => {
			const compactMapping: CompactMapping = [
				[0, [
					[0, 1],
					[1, 2]
				]]
			];

			const expanded = expandMapping(compactMapping);

			expect(expanded).toEqual([
				[0, 1, 0],
				[0, 2, 1]
			]);
		});

		it('should expand a compact mapping with multiple cells in a row', () => {
			const compactMapping: CompactMapping = [
				[0, [
					[0, [1, 3, 5]]
				]]
			];

			const expanded = expandMapping(compactMapping);

			expect(expanded).toEqual([
				[0, 1, 0],
				[0, 3, 0],
				[0, 5, 0]
			]);
		});

		it('should expand a compact mapping with range notation', () => {
			const compactMapping: CompactMapping = [
				[0, [
					[0, [[1, 3]]]
				]]
			];

			const expanded = expandMapping(compactMapping);

			expect(expanded).toEqual([
				[0, 1, 0],
				[0, 3, 0],
				[0, 5, 0]
			]);
		});

		it('should expand a complex compact mapping', () => {
			const compactMapping: CompactMapping = [
				[0, [
					[0, [1, 3, [5, 2]]],
					[1, 2]
				]],
				[1, [
					[0, 1]
				]]
			];

			const expanded = expandMapping(compactMapping);

			expect(expanded).toEqual([
				[0, 1, 0],
				[0, 3, 0],
				[0, 5, 0],
				[0, 7, 0],
				[0, 2, 1],
				[1, 1, 0]
			]);
		});
	});

	describe('expandMapping-compactMapping', () => {
		test.each(loadLayouts)('$name', ({ map }) => {
			const expanded = expandMapping(map);
			const testMap = compactMapping(expanded);
			expect(testMap).toEqual(map);
		});
	});

	describe('mappingToID', () => {
		it('should generate a consistent ID for a mapping', () => {
			const mapping: Mapping = [
				[0, 1, 0],
				[0, 3, 0]
			];

			const id = mappingToID(mapping);

			expect(typeof id).toBe('string');
			expect(id).toBe('1268543847'); // Same mapping should produce same ID
		});

		it('should generate different IDs for different mappings', () => {
			const mapping1: Mapping = [
				[0, 1, 0]
			];

			const mapping2: Mapping = [
				[0, 2, 0]
			];

			const id1 = mappingToID(mapping1);
			const id2 = mappingToID(mapping2);

			expect(id1).not.toBe(id2);
		});
	});

	describe('mappingBounds', () => {
		it('should calculate bounds correctly', () => {
			const mapping: Mapping = [
				[0, 1, 2],
				[3, 4, 5]
			];

			const bounds = mappingBounds(mapping, 0, 0, 0);

			expect(bounds).toEqual({
				x: 5, // max x + 1
				y: 6, // max y + 1
				z: 4 // max z + 1
			});
		});

		it('should respect minimum bounds', () => {
			const mapping: Mapping = [
				[0, 1, 2]
			];

			const bounds = mappingBounds(mapping, 5, 5, 5);

			expect(bounds).toEqual({
				x: 5,
				y: 5,
				z: 5
			});
		});

		it('should handle empty mapping', () => {
			const mapping: Mapping = [];

			const bounds = mappingBounds(mapping, 1, 2, 3);

			expect(bounds).toEqual({
				x: 2,
				y: 3,
				z: 1
			});
		});
	});
});
