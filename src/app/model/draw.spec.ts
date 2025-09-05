import { calcDrawPos, sortDrawItems, getDrawBoundsViewPort, getDrawViewPort, getDrawBounds, mappingToDrawItems, type Draw } from './draw';
import { Stone } from './stone';
import { CONSTS } from './consts';
import type { Mapping } from './types';

describe('Draw', () => {
	describe('calcDrawPos', () => {
		it('should calculate drawing position correctly', () => {
			const pos = calcDrawPos(1, 2, 3);

			expect(pos).toBeDefined();
			expect(pos.x).toBeDefined();
			expect(pos.y).toBeDefined();
			expect(pos.z).toBeDefined();
			expect(pos.translate).toBe(`translate(${pos.x},${pos.y})`);

			// Check z calculation specifically
			expect(pos.z).toBe(3 + CONSTS.mY * (2 + CONSTS.mX));
		});
	});

	describe('sortDrawItems', () => {
		it('should sort draw items by z position', () => {
			const stone = new Stone(0, 0, 0, 0, 0);
			const items: Array<Draw> = [
				{
					x: 0, y: 0, z: 0, v: 0, visible: true,
					pos: { x: 0, y: 0, z: 3, translate: '' },
					source: stone
				},
				{
					x: 0, y: 0, z: 0, v: 0, visible: true,
					pos: { x: 0, y: 0, z: 1, translate: '' },
					source: stone
				},
				{
					x: 0, y: 0, z: 0, v: 0, visible: true,
					pos: { x: 0, y: 0, z: 2, translate: '' },
					source: stone
				}
			];

			const sorted = sortDrawItems(items);

			expect(sorted[0].pos.z).toBe(1);
			expect(sorted[1].pos.z).toBe(2);
			expect(sorted[2].pos.z).toBe(3);
		});
	});

	describe('getDrawBounds', () => {
		it('should calculate bounds correctly', () => {
			const stone = new Stone(0, 0, 0, 0, 0);
			const items: Array<Draw> = [
				{
					x: 0, y: 0, z: 0, v: 0, visible: true,
					pos: { x: 10, y: 20, z: 0, translate: '' },
					source: stone
				},
				{
					x: 0, y: 0, z: 0, v: 0, visible: true,
					pos: { x: 30, y: 40, z: 0, translate: '' },
					source: stone
				}
			];

			const bounds = getDrawBounds(items, 100, 100);

			expect(bounds).toEqual([10, 20, 30, 40]);
		});

		it('should handle empty items array', () => {
			const bounds = getDrawBounds([], 100, 100);

			expect(bounds[0]).toBe(100);
			expect(bounds[1]).toBe(100);
			expect(bounds[2]).toBe(0);
			expect(bounds[3]).toBe(0);
		});
	});

	describe('getDrawBoundsViewPort', () => {
		it('should calculate viewport from bounds correctly', () => {
			const bounds = [10, 20, 30, 40];
			const viewport = getDrawBoundsViewPort(bounds, false);
			expect(viewport).toBe('-30 0 170 160');
		});

		it('should calculate rotated viewport from bounds correctly', () => {
			const bounds = [10, 20, 30, 40];
			const viewport = getDrawBoundsViewPort(bounds, true);
			expect(viewport).toBe('-150 -40 130 235');
		});
	});

	describe('getDrawViewPort', () => {
		it('should calculate viewport from items correctly', () => {
			const stone = new Stone(0, 0, 0, 0, 0);
			const items: Array<Draw> = [
				{
					x: 0, y: 0, z: 0, v: 0, visible: true,
					pos: { x: 10, y: 20, z: 0, translate: '' },
					source: stone
				},
				{
					x: 0, y: 0, z: 0, v: 0, visible: true,
					pos: { x: 30, y: 40, z: 0, translate: '' },
					source: stone
				}
			];

			const viewport = getDrawViewPort(items, 100, 100, false);

			expect(viewport).toBeDefined();
			expect(typeof viewport).toBe('string');
		});
	});

	describe('mappingToDrawItems', () => {
		it('should convert mapping to draw items', () => {
			const mapping: Mapping = [
				[0, 1, 2],
				[1, 2, 3]
			];

			const items = mappingToDrawItems(mapping);

			expect(items).toHaveLength(2);
			expect(items[0].z).toBe(mapping[0][0]);
			expect(items[0].x).toBe(mapping[0][1]);
			expect(items[0].y).toBe(mapping[0][2]);
			expect(items[1].z).toBe(mapping[1][0]);
			expect(items[1].x).toBe(mapping[1][1]);
			expect(items[1].y).toBe(mapping[1][2]);

			// Items should be sorted
			expect(items[0].pos.z <= items[1].pos.z).toBe(true);
		});
	});
});
