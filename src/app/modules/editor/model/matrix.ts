import type { Mapping } from '../../../model/types';
import { mappingBounds } from '../../../model/mapping';

interface Row extends Array<number> {
}

interface Level extends Array<Row> {
}

export class Matrix {
	levels: Array<Level> = [];

	constructor() {
		this.init(2, 2, 1);
	}

	init(width: number, height: number, levels: number) {
		const m: Array<Level> = [];
		for (let z = 0; z < levels; z++) {
			m[z] = [];
			for (let x = 0; x < width; x++) {
				m[z][x] = [];
				for (let y = 0; y < height; y++) {
					m[z][x][y] = 0;
				}
			}
		}
		this.levels = m;
	}

	clear() {
		const m = this.levels;
		for (const level of m) {
			for (const row of level) {
				for (let y = 0; y < row.length; y++) {
					row[y] = 0;
				}
			}
		}
	}

	inBounds(z: number, x: number, y: number): boolean {
		const hasPositiveCoords = (z >= 0) && (x >= 0) && (y >= 0);
		const withinLevelBounds = (z < this.levels.length) && (x < this.levels[0].length) && (y < this.levels[0][0].length);
		return hasPositiveCoords && withinLevelBounds;
	}

	isTile(z: number, x: number, y: number): boolean {
		return this.levels[z][x][y] > 0;
	}

	isTilePosInvalid(z: number, x: number, y: number): boolean {
		const currentLevel = this.levels[z];

		// Check if position is out of bounds
		if (!currentLevel[x + 1]) return true;
		if (currentLevel[x].length - 1 === y) return true;

		// Helper function to safely check tile value
		const getTileValue = (dx: number, dy: number): number => {
			const row = currentLevel[x + dx];
			return row ? row[y + dy] || 0 : 0;
		};

		// Check surrounding tiles
		const surroundingPositions = [
			[0, 1], // current column, next row
			[-1, 1], // left column, next row
			[-1, -1], // left column, previous row
			[1, 0], // right column, same row
			[1, -1], // right column, previous row
			[1, 1] // right column, next row
		];

		return surroundingPositions.some(([dx, dy]) => getTileValue(dx, dy) > 0);
	}

	isTilePosBlocked(z: number, x: number, y: number): boolean {
		if (this.levels[z][x][y - 1] > 0) {
			return true;
		}
		if (!this.levels[z][x - 1]) {
			return false;
		}
		if (this.levels[z][x - 1][y] > 0) {
			return true;
		}
		return (this.levels[z][x - 1][y - 1] > 0);
	}

	get(z: number, x: number, y: number): number {
		return this.levels[z][x][y] || 0;
	}

	setValue(z: number, x: number, y: number, value: number): void {
		this.levels[z][x][y] = value;
	}

	applyMapping(mapping: Mapping, minLevel: number, minX: number, minY: number) {
		const bounds = mappingBounds(mapping, minLevel, minX, minY);
		this.init(bounds.x + 1, bounds.y + 1, bounds.z);
		for (const place of mapping) {
			const z = place[0];
			const x = place[1];
			const y = place[2];
			this.setValue(z, x, y, 1);
		}
	}
}
