import { Component, type OnChanges, type OnDestroy, type SimpleChanges, inject, input, output } from '@angular/core';
import type { Layout } from '../../../../model/types';
import { LayoutService } from '../../../../service/layout.service';
import { WorkerService } from '../../../../service/worker.service';
import { LayoutPreviewComponent } from '../../../../components/layout-preview/layout-preview.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
	selector: 'app-manager-component',
	templateUrl: './manager.component.html',
	styleUrls: ['./manager.component.scss'],
	imports: [LayoutPreviewComponent, TranslatePipe]
})
export class ManagerComponent implements OnChanges, OnDestroy {
	readonly inputLayouts = input<Array<Layout>>();
	readonly editEvent = output<Layout>();
	layouts: Array<Layout>;
	test: { [key: string]: { win: number; fail: number; msg?: string } | undefined } = {};
	sortColumn: number = 1;
	sortDesc: boolean = true;
	showBuildIn: boolean = true;
	worker?: Worker;
	layoutService = inject(LayoutService);
	workerService = inject(WorkerService);

	constructor() {
		this.update();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.inputLayouts) {
			this.update();
		}
	}

	ngOnDestroy(): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = undefined;
		}
	}

	editLayout(layout: Layout): void {
		this.editEvent.emit(layout);
	}

	toggleBuildIn() {
		this.showBuildIn = !this.showBuildIn;
		this.update();
	}

	clickSortBy(_event: MouseEvent, column: number) {
		if (this.sortColumn === column) {
			this.sortDesc = !this.sortDesc;
		}
		this.sortBy(column);
	}

	update() {
		const inputLayouts = this.inputLayouts();
		if (inputLayouts) {
			this.layouts = inputLayouts.sort((a, b) => a.name.localeCompare(b.name));
			if (!this.showBuildIn) {
				this.layouts = this.layouts.filter(l => l.custom);
			}
			this.sortBy(this.sortColumn);
		}
	}

	removeCustomBoard(event: MouseEvent, layout: Layout): void {
		event.stopPropagation();
		this.layoutService.removeCustomLayout([layout.id]);
		this.update();
	}

	removeCustomLayouts(event: MouseEvent): void {
		event.stopPropagation();
		this.layoutService.removeAllCustomLayouts();
		this.update();
	}

	sortBy(column: number) {
		this.sortColumn = column;
		this.layouts = this.layouts.sort((a, b) => {
			let result: number;
			switch (column) {
				case 1: {
					result = a.name.localeCompare(b.name);
					break;
				}
				case 2: {
					result = (a.by ?? '').localeCompare((b.by ?? ''));
					break;
				}
				case 3: {
					result = (a.category ?? '').localeCompare((b.category ?? ''));
					break;
				}
				case 4: {
					result = a.mapping.length - b.mapping.length;
					break;
				}
				default: {
					result = 0;
				}
			}
			return (this.sortDesc ? 1 : -1) * result;
		});
	}

	testLayout(event: MouseEvent, layout: Layout): void {
		event.stopPropagation();
		this.startTestLayout(layout);
	}

	startTestLayout(layout: Layout, callback?: () => void): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = undefined;
			return;
		}
		this.test[layout.id] = undefined;
		this.worker = this.workerService.solve(layout.mapping, 10, progress => {
			this.test[layout.id] = { win: progress[0], fail: progress[1] };
		}, finish => {
			this.test[layout.id] = { win: finish[0], fail: finish[1] };
			this.worker = undefined;
			if (callback) {
				callback();
			}
		});
	}

	testLayouts(_event: MouseEvent): void {
		if (this.worker) {
			this.worker.terminate();
			return;
		}
		this.testNextLayout();
	}

	testNextLayout(): void {
		const next = this.layouts.find(l => !this.test[l.id]);
		if (next) {
			this.startTestLayout(next, () => {
				this.testNextLayout();
			})
		}
	}

}
