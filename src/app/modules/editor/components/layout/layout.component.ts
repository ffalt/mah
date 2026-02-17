import { Component, type OnChanges, type OnDestroy, type OnInit, type SimpleChanges, inject, model } from '@angular/core';
import { Matrix } from '../../model/matrix';
import { CONSTS } from '../../../../model/consts';
import { WorkerService } from '../../../../service/worker.service';
import { LayoutService } from '../../../../service/layout.service';
import type { Place, SafeUrlSVG } from '../../../../model/types';
import type { Cell } from '../../model/cell';
import type { Stone } from '../../../../model/stone';
import type { EditLayout } from '../../model/edit-layout';
import { ExportComponent } from '../export/export.component';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutPreviewComponent } from '../../../../components/layout-preview/layout-preview.component';
import { BoardComponent } from '../board/board.component';
import { CommonModule } from '@angular/common';
import { optimizeMapping } from '../../model/optimize';

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

interface EditLevel {
	z: number;
	rows: Array<Array<number>>;
	showTiles: boolean;
}

@Component({
	selector: 'app-editor-layout-component',
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	imports: [CommonModule, BoardComponent, LayoutPreviewComponent, ExportComponent, TranslatePipe]
})
export class LayoutComponent implements OnInit, OnChanges, OnDestroy {
	readonly layout = model.required<EditLayout>();
	level: EditLevel;
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
	mirrorX: boolean = false;
	mirrorY: boolean = false;
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

	removeStone(z: number, x: number, y: number): void {
		this.layout().mapping = this.layout().mapping.filter(m => ((m[0] !== z) || (m[1] !== x) || (m[2] !== y)));
		this.matrix.applyMapping(this.layout().mapping, this.totalZ, this.totalX, this.totalY);
	}

	addStone(z: number, x: number, y: number): void {
		this.layout().mapping.push([z, x, y]);
		this.matrix.applyMapping(this.layout().mapping, this.totalZ, this.totalX, this.totalY);
	}

	mirrorXValue(x: number): number {
		return this.totalX - 2 - x;
	}

	mirrorYValue(y: number): number {
		return this.totalY - 2 - y;
	}

	onPosClick(z: number, x: number, y: number): void {
		if (this.matrix.isTilePosBlocked(z, x, y) || this.matrix.isTilePosInvalid(z, x, y)) {
			return;
		}
		if (this.matrix.isTile(z, x, y)) {
			this.removeStone(z, x, y);
			const toRemove: Array<[number, number, number]> = [];
			if (this.mirrorX) {
				toRemove.push([z, this.mirrorXValue(x), y]);
			}
			if (this.mirrorY) {
				toRemove.push([z, x, this.mirrorYValue(y)]);
			}
			if (this.mirrorX && this.mirrorY) {
				toRemove.push([z, this.mirrorXValue(x), this.mirrorYValue(y)]);
			}
			for (const [zz, xx, yy] of toRemove) {
				if (this.matrix.isTile(zz, xx, yy)) {
					this.removeStone(zz, xx, yy);
				}
			}
		} else {
			this.addStone(z, x, y);
			const toAdd: Array<[number, number, number]> = [];
			if (this.mirrorX) {
				const xM = this.mirrorXValue(x);
				toAdd.push([z, xM, y]);
			}
			if (this.mirrorY) {
				const yM = this.mirrorYValue(y);
				toAdd.push([z, x, yM]);
			}
			if (this.mirrorX && this.mirrorY) {
				const xM = this.mirrorXValue(x);
				const yM = this.mirrorYValue(y);
				toAdd.push([z, xM, yM]);
			}
			for (const [zz, xx, yy] of toAdd) {
				if (
					!this.matrix.isTilePosBlocked(zz, xx, yy) &&
					!this.matrix.isTilePosInvalid(zz, xx, yy) &&
					!this.matrix.isTile(zz, xx, yy)
				) {
					this.addStone(zz, xx, yy);
				}
			}
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

	moveLayer(xAxis: boolean, delta: number): void {
		const list = this.layout().mapping.filter(m => m[0] === this.currentZ);
		const index = xAxis ? 1 : 2;
		const maxBound = xAxis ? CONSTS.mX : CONSTS.mY;
		let min = list[0][index];
		let max = list[0][index];
		for (const m of list) {
			min = Math.min(m[index], min);
			max = Math.max(m[index], max);
		}
		if (min + delta < 0 || max + delta >= maxBound - 1) {
			return;
		}
		for (const m of list) {
			m[index] = m[index] + delta;
		}
		this.refresh();
	}

	toggleMirrorX(): void {
		this.mirrorX = !this.mirrorX;
	}

	toggleMirrorY(): void {
		this.mirrorY = !this.mirrorY;
	}

	moveLayerX(deltaX: number): void {
		this.moveLayer(true, deltaX);
	}

	moveLayerY(deltaY: number): void {
		this.moveLayer(false, deltaY);
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
