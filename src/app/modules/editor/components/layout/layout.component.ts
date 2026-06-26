import { Component, type OnChanges, type OnDestroy, type OnInit, type SimpleChanges, inject, model, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { mappingExtents } from '../../../../model/mapping';
import { IconCloseComponent } from '../../../../components/icons/icon-close.component';
import { IconListAddComponent } from '../../../../components/icons/icon-list-add.component';
import { IconUpComponent } from '../../../../components/icons/icon-up.component';
import { IconDownComponent } from '../../../../components/icons/icon-down.component';
import { IconDuplicateComponent } from '../../../../components/icons/icon-duplicate.component';
import { IconClearComponent } from '../../../../components/icons/icon-clear.component';
import { IconDeleteComponent } from '../../../../components/icons/icon-delete.component';
import { IconLeftComponent } from '../../../../components/icons/icon-left.component';
import { IconRightComponent } from '../../../../components/icons/icon-right.component';

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
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './layout.component.html',
	styleUrls: ['./layout.component.scss'],
	imports: [CommonModule, BoardComponent, LayoutPreviewComponent, ExportComponent, TranslatePipe, IconCloseComponent,
		IconListAddComponent, IconUpComponent, IconDownComponent, IconDuplicateComponent,
		IconClearComponent, IconDeleteComponent, IconLeftComponent, IconRightComponent]
})
export class LayoutComponent implements OnInit, OnChanges, OnDestroy {
	readonly layout = model.required<EditLayout>();
	readonly level = signal<EditLevel | undefined>(undefined);
	readonly stats = signal<Stats | undefined>(undefined);
	readonly solveStats = signal<SolveStats | undefined>(undefined);
	readonly solveWorker = signal<Worker | undefined>(undefined);
	readonly currentZ = signal(0);
	readonly saveDialog = signal(false);
	readonly mirrorX = signal(false);
	readonly mirrorY = signal(false);
	readonly svg = signal<SafeUrlSVG | undefined>(undefined);
	totalZ = 1;
	totalY = CONSTS.mY;
	totalX = CONSTS.mX;
	matrix: Matrix = new Matrix();
	hasChanged: boolean = false;
	readonly worker = inject(WorkerService);
	readonly layoutService = inject(LayoutService);

	ngOnDestroy(): void {
		this.cancelSolve();
	}

	getStats(layout: EditLayout): Stats {
		const extents = mappingExtents(layout.mapping);
		return {
			name: layout.name,
			totalCount: layout.mapping.length,
			layerCount: layout.mapping.filter(m => m[0] === this.currentZ()).length,
			countInvalid: (layout.mapping.length > 144) || !!(layout.mapping.length % 2),
			...extents,
			width: extents.maxX - extents.minX,
			height: extents.maxY - extents.minY,
			depth: extents.maxZ - extents.minZ
		};
	}

	ngOnInit(): void {
		if (!this.layout()) {
			return;
		}

		this.refresh();
		this.hasChanged = false;
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (!changes.layout) {
			return;
		}

		this.refresh();
		this.hasChanged = false;
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
			if (this.mirrorX()) {
				toRemove.push([z, this.mirrorXValue(x), y]);
			}
			if (this.mirrorY()) {
				toRemove.push([z, x, this.mirrorYValue(y)]);
			}
			if (this.mirrorX() && this.mirrorY()) {
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
			if (this.mirrorX()) {
				const xM = this.mirrorXValue(x);
				toAdd.push([z, xM, y]);
			}
			if (this.mirrorY()) {
				const yM = this.mirrorYValue(y);
				toAdd.push([z, x, yM]);
			}
			if (this.mirrorX() && this.mirrorY()) {
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
		this.level.set({ z, rows: this.matrix.levels[z], showTiles: true });
		this.currentZ.set(z);
		this.refresh();
	}

	refresh(): void {
		const layout = this.layout();
		if (!layout) {
			return;
		}
		this.hasChanged = true;
		this.matrix.applyMapping(layout.mapping, this.totalZ, this.totalX, this.totalY);
		const currentZ = this.currentZ();
		this.stats.set(this.getStats(layout));
		this.level.set({ z: currentZ, rows: this.matrix.levels[currentZ], showTiles: true });
		const svg = this.layoutService.generatePreview(optimizeMapping(layout.mapping));
		this.svg.set(svg);
		layout.previewSVG = svg;
	}

	moveX(delta: number): void {
		this.moveAxis(1, delta, CONSTS.mX);
	}

	moveY(delta: number): void {
		this.moveAxis(2, delta, CONSTS.mY);
	}

	moveLayer(isXAxis: boolean, delta: number): void {
		const list = this.layout().mapping.filter(m => m[0] === this.currentZ());
		if (list.length === 0) {
			return;
		}
		const index = isXAxis ? 1 : 2;
		const maxBound = isXAxis ? CONSTS.mX : CONSTS.mY;
		let min = list[0][index];
		let max = list[0][index];
		for (const m of list) {
			min = Math.min(m[index], min);
			max = Math.max(m[index], max);
		}
		if (min + delta < 0 || max + delta >= maxBound) {
			return;
		}
		for (const m of list) {
			m[index] += delta;
		}
		this.refresh();
	}

	toggleMirrorX(): void {
		this.mirrorX.set(!this.mirrorX());
	}

	toggleMirrorY(): void {
		this.mirrorY.set(!this.mirrorY());
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
				m[0] += 1;
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
				m[0] -= 1;
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
				m[0] += 1;
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
				m[0] += deltaZ;
			} else if (m[0] === layer + deltaZ) {
				m[0] = layer;
			}
		}
		if (layer === this.currentZ()) {
			this.currentZ.set(this.currentZ() + deltaZ);
		}
		this.refresh();
	}

	toggleSave(): void {
		this.saveDialog.set(!this.saveDialog());
	}

	toggleAfterSave(): void {
		this.saveDialog.set(false);
		this.hasChanged = false;
	}

	cancelSolve(): void {
		const worker = this.solveWorker();
		if (!worker) {
			return;
		}

		worker.terminate();
		this.solveWorker.set(undefined);
	}

	solve(): void {
		if (this.solveWorker()) {
			return;
		}
		this.solveStats.set({ fail: 0, won: 0 });
		this.solveWorker.set(this.worker.solve(this.layout().mapping, 1000,
			progress => {
				this.solveStats.set({ won: progress[0], fail: progress[1] });
			}, result => {
				this.solveStats.set({ won: result[0], fail: result[1] });
				this.solveWorker.set(undefined);
			}));
	}

	moveAxis(axis: 1 | 2, delta: number, maxBound: number): void {
		const stats = this.stats();
		if (!stats) {
			return;
		}
		const minKey = axis === 1 ? 'minX' : 'minY';
		const maxKey = axis === 1 ? 'maxX' : 'maxY';
		if (stats[minKey] + delta < 0 || stats[maxKey] + delta >= maxBound - 1) {
			return;
		}
		for (const m of this.layout().mapping) {
			// eslint-disable-next-line unicorn/operator-assignment
			m[axis] = m[axis] + delta;
		}
		this.refresh();
	}
}
