import { Component, type OnChanges, type OnDestroy, type OnInit, type SimpleChanges, inject, model } from '@angular/core';
import { Matrix } from '../../model/matrix';
import { CONSTS } from '../../../../model/consts';
import { WorkerService } from '../../../../service/worker.service';
import { LayoutService } from '../../../../service/layout.service';
import { optimizeMapping } from '../../model/import';
import type { Place, SafeUrlSVG } from '../../../../model/types';
import type { Cell } from '../../model/cell';
import type { Stone } from '../../../../model/stone';
import type { EditLayout } from '../../model/edit-layout';

interface Stats {
	name: string;
	totalCount: number;
	layerCount: number;
	countInvalid: boolean;
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
	minZ: number;
	maxZ: number;
	height: number;
	width: number;
	depth: number;
}

interface SolveStats {
	fail: number;
	won: number;
}

@Component({
	selector: 'app-editor-layout-component',
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	standalone: false
})
export class LayoutComponent implements OnInit, OnChanges, OnDestroy {
	readonly layout = model.required<EditLayout>();
	level: {
		z: number;
		rows: Array<Array<number>>;
		showTiles: boolean;
	};
	stats: Stats;
	solveStats?: SolveStats;
	solveWorker?: Worker;
	currentZ = 0;
	totalZ = 1;
	totalY = CONSTS.mY;
	totalX = CONSTS.mX;
	matrix: Matrix = new Matrix();
	saveDialog: boolean = false;
	hasChanged: boolean = false;
	svg: SafeUrlSVG;
	worker = inject(WorkerService);
	layoutService = inject(LayoutService);

	ngOnDestroy(): void {
		this.cancelSolve();
	}

	getStats(layout: EditLayout): Stats {
		const stats: Stats = {
			name: layout.name,
			totalCount: layout.mapping.length,
			layerCount: layout.mapping.filter(m => m[0] === this.currentZ).length,
			countInvalid: (layout.mapping.length > 144) || !!(layout.mapping.length % 2),
			minX: 100,
			maxX: 0,
			minY: 100,
			maxY: 0,
			minZ: 100,
			maxZ: 0,
			height: 0,
			width: 0,
			depth: 0
		};
		for (const m of layout.mapping) {
			if (m[0] < stats.minZ) {
				stats.minZ = m[0];
			}
			if (m[0] > stats.maxZ) {
				stats.maxZ = m[0];
			}
			if (m[1] < stats.minX) {
				stats.minX = m[1];
			}
			if (m[1] > stats.maxX) {
				stats.maxX = m[1];
			}
			if (m[2] < stats.minY) {
				stats.minY = m[2];
			}
			if (m[2] > stats.maxY) {
				stats.maxY = m[2];
			}
		}
		stats.width = (stats.maxX - stats.minX);
		stats.height = (stats.maxY - stats.minY);
		stats.depth = (stats.maxZ - stats.minZ);
		return stats;
	}

	ngOnInit(): void {
		if (this.layout()) {
			this.refresh();
			this.hasChanged = false;
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.layout) {
			this.refresh();
			this.hasChanged = false;
		}
	}

	onPosClick(z: number, x: number, y: number): void {
		if (this.matrix.isTilePosBlocked(z, x, y) || this.matrix.isTilePosInvalid(z, x, y)) {
			return;
		}
		if (!this.matrix.isTile(z, x, y)) {
			this.layout().mapping.push([z, x, y]);
		} else {
			this.layout().mapping = this.layout().mapping.filter(m => ((m[0] !== z) || (m[1] !== x) || (m[2] !== y)));
		}
		this.refresh();
	}

	onCellClick(cell: Cell): void {
		this.onPosClick(cell.z, cell.x, cell.y);
	}

	onStoneClick(stone?: Stone): void {
		if (stone) {
			this.onPosClick(stone.z, stone.x, stone.y);
		}
	}

	selectLevel(z: number): void {
		this.level = { z, rows: this.matrix.levels[z], showTiles: true };
		this.currentZ = z;
		this.refresh();
	}

	refresh(): void {
		const layout = this.layout();
		if (!layout) {
			return;
		}
		this.hasChanged = true;
		this.matrix.applyMapping(layout.mapping, this.totalZ, this.totalX, this.totalY);
		this.stats = this.getStats(layout);
		this.level = { z: this.currentZ, rows: this.matrix.levels[this.currentZ], showTiles: true };
		this.svg = this.layoutService.generatePreview(optimizeMapping(layout.mapping));
		layout.previewSVG = this.svg;
	}

	moveX(x: number): void {
		if (this.stats.minX + x < 0 || this.stats.maxX + x >= CONSTS.mX - 1) {
			return;
		}
		const mapping = this.layout().mapping;
		for (const m of mapping) {
			m[1] = m[1] + x;
		}
		this.refresh();
	}

	moveY(y: number): void {
		if (this.stats.minY + y < 0 || this.stats.maxY + y >= CONSTS.mY - 1) {
			return;
		}
		const mapping = this.layout().mapping;
		for (const m of mapping) {
			m[2] = m[2] + y;
		}
		this.refresh();
	}

	moveLayerX(deltaX: number): void {
		const list = this.layout().mapping.filter(m => m[0] === this.currentZ);
		let minx = list[0][1];
		let maxx = list[0][1];
		for (const m of list) {
			minx = Math.min(m[1], minx);
			maxx = Math.max(m[1], maxx);
		}
		if (minx + deltaX < 0 || maxx + deltaX >= CONSTS.mX - 1) {
			return;
		}
		for (const m of list) {
			m[1] = m[1] + deltaX;
		}
		this.refresh();
	}

	moveLayerY(deltaY: number): void {
		const list = this.layout().mapping.filter(m => m[0] === this.currentZ);
		let miny = list[0][2];
		let maxy = list[0][2];
		for (const m of list) {
			miny = Math.min(m[2], miny);
			maxy = Math.max(m[2], maxy);
		}
		if (miny + deltaY < 0 || maxy + deltaY >= CONSTS.mY - 1) {
			return;
		}
		for (const m of list) {
			m[2] = m[2] + deltaY;
		}
		this.refresh();
	}

	duplicateLayerZ(layer: number): void {
		const dups: Array<Place> = [];
		const mapping = this.layout().mapping;
		for (const m of mapping) {
			if (m[0] > layer) {
				m[0] = m[0] + 1;
			} else if (m[0] === layer) {
				dups.push(m);
			}
		}
		for (const m of dups) {
			mapping.push([layer + 1, m[1], m[2]]);
		}
		this.refresh();
	}

	clearLayerZ(layer: number): void {
		this.layout().mapping = this.layout().mapping.filter(m => m[0] !== layer);
		this.refresh();
	}

	deleteLayerZ(layer: number): void {
		this.layout().mapping = this.layout().mapping.filter(m => m[0] !== layer);
		for (const m of this.layout().mapping) {
			if (m[0] > layer) {
				m[0] = m[0] - 1;
			}
		}
		this.totalZ = Math.max(this.totalZ - 1, 1);
		this.refresh();
	}

	newLayerBelow(layer: number): void {
		this.totalZ += 1;
		const mapping = this.layout().mapping;
		for (const m of mapping) {
			if (m[0] > layer) {
				m[0] = m[0] + 1;
			}
		}
		this.refresh();
	}

	moveLayerZ(deltaZ: number, layer: number): void {
		if (layer + deltaZ < 0 || layer + deltaZ >= this.matrix.levels.length) {
			return;
		}
		const mapping = this.layout().mapping;
		for (const m of mapping) {
			if (m[0] === layer) {
				m[0] = m[0] + deltaZ;
			} else if (m[0] === layer + deltaZ) {
				m[0] = layer;
			}
		}
		if (layer === this.currentZ) {
			this.currentZ = this.currentZ + deltaZ;
		}
		this.refresh();
	}

	toggleSave(): void {
		this.saveDialog = !this.saveDialog;
	}

	toggleAfterSave(): void {
		this.saveDialog = false;
		this.hasChanged = false;
	}

	cancelSolve(): void {
		if (this.solveWorker) {
			this.solveWorker.terminate();
			this.solveWorker = undefined;
		}
	}

	solve(): void {
		if (this.solveWorker) {
			return;
		}
		const solveStats = { fail: 0, won: 0 };
		this.solveWorker = this.worker.solve(this.layout().mapping, 1000,
			progress => {
				solveStats.won = progress[0];
				solveStats.fail = progress[1];
			}, result => {
				solveStats.won = result[0];
				solveStats.fail = result[1];
				this.solveWorker = undefined;
			});
		this.solveStats = solveStats;
	}

}
