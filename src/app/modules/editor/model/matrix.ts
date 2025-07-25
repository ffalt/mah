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
		return (z >= 0) && (x >= 0) && (y >= 0) && (z < this.levels.length) && (x < this.levels[0].length) && (y < this.levels[0][0].length);
	}

	isTile(z: number, x: number, y: number): boolean {
		return this.levels[z][x][y] > 0;
	}

	isTilePosInvalid(z: number, x: number, y: number): boolean {
		if (!this.levels[z][x + 1]) {
			return true;
		}
		if (this.levels[z][x].length - 1 === y) {
			return true;
		}
		if (this.levels[z][x][y + 1] > 0) {
			return true;
		}
		if ((this.levels[z][x - 1] ? this.levels[z][x - 1][y + 1] : 0) > 0) {
			return true;
		}
		if ((this.levels[z][x - 1] ? this.levels[z][x - 1][y - 1] : 0) > 0) {
			return true;
		}
		if ((this.levels[z][x + 1] ? this.levels[z][x + 1][y] : 0) > 0) {
			return true;
		}
		if ((this.levels[z][x + 1] ? this.levels[z][x + 1][y - 1] : 0) > 0) {
			return true;
		}
		if ((this.levels[z][x + 1] ? this.levels[z][x + 1][y - 1] : 0) > 0) {
			return true;
		}
		return (this.levels[z][x + 1] ? this.levels[z][x + 1][y + 1] : 0) > 0;
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
