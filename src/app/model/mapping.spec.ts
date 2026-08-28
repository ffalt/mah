import { expandMapping, mappingToID, mappingBounds, mappingExtents } from './mapping';
import type { CompactMapping, LoadLayout, Mapping } from './types';
import { readFileSync } from 'node:fs';
import { compactMapping } from '../modules/editor/model/import';
import { describe, it, expect, test } from 'vitest';

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

		it('should clamp an out-of-range repeated-cell count instead of allocating it verbatim', () => {
			const compactMapping: CompactMapping = [
				[0, [
					[0, [[0, 500_000_000]]]
				]]
			];

			const expanded = expandMapping(compactMapping);

			expect(expanded.length).toBeLessThan(100);
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

	describe('mappingExtents', () => {
		it('should report the extents of a mapping', () => {
			const mapping: Mapping = [[1, 4, 6], [0, 2, 8], [3, 10, 2]];

			expect(mappingExtents(mapping)).toEqual({
				minZ: 0, maxZ: 3,
				minX: 2, maxX: 10,
				minY: 2, maxY: 8
			});
		});

		// a new board starts empty, and the Infinity sentinels used to be rendered
		// straight into the editor's dimension readout as "xInfinity … x-Infinity"
		it('should report zeroed extents for an empty mapping', () => {
			expect(mappingExtents([])).toEqual({
				minZ: 0, maxZ: 0,
				minX: 0, maxX: 0,
				minY: 0, maxY: 0
			});
		});

		it('should report a single place as its own extents', () => {
			expect(mappingExtents([[2, 5, 7]])).toEqual({
				minZ: 2, maxZ: 2,
				minX: 5, maxX: 5,
				minY: 7, maxY: 7
			});
		});
	});
});
