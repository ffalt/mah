import { calcDrawPos, sortDrawItems, getDrawBoundsViewport, getDrawViewport, getDrawBounds, mappingToDrawItems, type Draw } from './draw';
import { Stone } from './stone';
import { CONSTS } from './consts';
import type { Mapping } from './types';
import { describe, it, expect } from 'vitest';

describe('Draw', () => {
	const stone = new Stone(0, 0, 0, 0, 0);
	const boundsItems: Array<Draw> = [
		{ x: 0, y: 0, z: 0, v: 0, visible: true, pos: { x: 10, y: 20, w: 10, h: 10, translate: '' }, source: stone },
		{ x: 0, y: 0, z: 0, v: 0, visible: true, pos: { x: 30, y: 40, w: 10, h: 10, translate: '' }, source: stone }
	];

	function drawAt(z: number, x: number, y: number): Draw {
		return { x, y, z, v: 0, visible: true, pos: calcDrawPos(z, x, y), source: stone };
	}

	function order(items: Array<Draw>): Array<string> {
		return sortDrawItems(items).map(item => `${item.z}/${item.x}/${item.y}`);
	}

	describe('calcDrawPos', () => {
		it('should calculate drawing position correctly', () => {
			const pos = calcDrawPos(1, 2, 3);

			expect(pos).toBeDefined();
			expect(pos.x).toBeDefined();
			expect(pos.y).toBeDefined();
			expect(pos.w).toBeDefined();
			expect(pos.h).toBeDefined();
			expect(pos.translate).toBe(`translate(${pos.x},${pos.y})`);
		});

		it('should place a tile half a tile per grid step', () => {
			expect(calcDrawPos(0, 0, 0).x).toBe(0);
			expect(calcDrawPos(0, 1, 0).x).toBe((CONSTS.tileWidth + 2) / 2);
			expect(calcDrawPos(0, 0, 1).y).toBe((CONSTS.tileHeight + 2) / 2);
		});
	});

	// The 3D side of a tile sticks out to the right and below its face, further than the
	// gap to the next cell. So a neighbour whose face lands on that side must be painted
	// after it, otherwise the side is left half drawn on top of the neighbour.
	describe('sortDrawItems', () => {
		it('should paint lower levels before higher ones', () => {
			expect(order([drawAt(2, 0, 0), drawAt(0, 30, 14), drawAt(1, 8, 4)]))
				.toEqual(['0/30/14', '1/8/4', '2/0/0']);
		});

		it('should paint the right neighbour after the tile whose side it covers', () => {
			expect(order([drawAt(0, 2, 0), drawAt(0, 0, 0)]))
				.toEqual(['0/0/0', '0/2/0']);
		});

		it('should paint the lower neighbour after the tile whose side it covers', () => {
			expect(order([drawAt(0, 0, 2), drawAt(0, 0, 0)]))
				.toEqual(['0/0/0', '0/0/2']);
		});

		// a diagonal staircase steps one tile across and half a tile down; the up-right
		// tile covers the side of the down-left one, so it has to come second
		it('should paint the up-right tile of a half-step diagonal last', () => {
			expect(order([drawAt(0, 18, 0), drawAt(0, 16, 1)]))
				.toEqual(['0/16/1', '0/18/0']);
		});

		it('should break ties on equal depth so the order never falls back to input order', () => {
			const forwards = order([drawAt(0, 4, 0), drawAt(0, 2, 2)]);
			const backwards = order([drawAt(0, 2, 2), drawAt(0, 4, 0)]);
			expect(forwards).toEqual(backwards);
		});

		it('should not let a wide low level jump ahead of a narrow higher one', () => {
			expect(order([drawAt(2, 0, 0), drawAt(1, 36, 16)]))
				.toEqual(['1/36/16', '2/0/0']);
		});
	});

	describe('getDrawBounds', () => {
		it('should calculate bounds correctly', () => {
			const bounds = getDrawBounds(boundsItems);

			expect(bounds).toEqual([10, 20, 40, 50]);
		});

		it('should handle empty items array', () => {
			const bounds = getDrawBounds([]);

			expect(bounds[0]).toBe(0);
			expect(bounds[1]).toBe(0);
			expect(bounds[2]).toBe(0);
			expect(bounds[3]).toBe(0);
		});
	});

	describe('getDrawBoundsViewPort', () => {
		it('should calculate viewport from bounds correctly', () => {
			const bounds = [10, 20, 30, 40];
			const viewport = getDrawBoundsViewport(bounds);
			expect(viewport).toBe('-10 0 60 60');
		});
	});

	describe('getDrawViewPort', () => {
		it('should calculate viewport from items correctly', () => {
			const viewport = getDrawViewport(boundsItems);
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

			// Items should be sorted back to front
			expect(items[0].z).toBeLessThanOrEqual(items[1].z);
		});
	});
});
