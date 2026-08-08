import { Component, type OnChanges, type OnDestroy, type SimpleChanges, inject, input, output, signal } from '@angular/core';
import type { Layout } from '../../../../model/types';
import { LayoutService } from '../../../../service/layout.service';
import { WorkerService } from '../../../../service/worker.service';
import { LayoutPreviewComponent } from '../../../../components/layout-preview/layout-preview.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IconDeleteComponent } from '../../../../components/icons/icon-delete.component';
import { IconExecuteComponent } from '../../../../components/icons/icon-execute.component';

@Component({
	selector: 'app-manager-component',
	templateUrl: './manager.component.html',
	styleUrls: ['./manager.component.scss'],
	imports: [LayoutPreviewComponent, TranslatePipe, IconDeleteComponent, IconExecuteComponent]
})
export class ManagerComponent implements OnChanges, OnDestroy {
	readonly inputLayouts = input<Array<Layout>>();
	readonly editEvent = output<Layout>();
	readonly layouts = signal<Array<Layout>>([]);
	readonly test = signal<{ [key: string]: { win: number; fail: number; msg?: string } | undefined }>({});
	readonly sortColumn = signal(1);
	readonly sortDesc = signal(true);
	readonly showBuiltIn = signal(false);
	worker?: Worker;
	readonly layoutService = inject(LayoutService);
	readonly workerService = inject(WorkerService);
	readonly translate = inject(TranslateService);

	constructor() {
		this.update();
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.inputLayouts) {
			this.update();
		}
	}

	ngOnDestroy(): void {
		if (!this.worker) {
			return;
		}

		this.worker.terminate();
		this.worker = undefined;
	}

	editLayout(layout: Layout): void {
		this.editEvent.emit(layout);
	}

	toggleBuiltIn() {
		this.showBuiltIn.set(!this.showBuiltIn());
		this.update();
	}

	activateSortBy(column: number): void {
		if (this.sortColumn() === column) {
			this.sortDesc.set(!this.sortDesc());
		}
		this.sortBy(column);
	}

	clickSortBy(_event: MouseEvent, column: number) {
		this.activateSortBy(column);
	}

	update() {
		const inputLayouts = this.inputLayouts();
		if (inputLayouts) {
			let layouts = [...inputLayouts].sort((a, b) => a.name.localeCompare(b.name));
			if (!this.showBuiltIn()) {
				layouts = layouts.filter(l => l.custom);
			}
			this.layouts.set(layouts);
			this.sortBy(this.sortColumn());
		}
	}

	removeCustomBoard(event: MouseEvent, layout: Layout): void {
		event.stopPropagation();
		this.layoutService.removeCustomLayout([layout.id]);
		this.update();
	}

	removeCustomLayouts(event: MouseEvent): void {
		event.stopPropagation();
		if (!confirm(this.translate.instant('CUSTOM_BOARD_DELETE_ALL_SURE'))) {
			return;
		}
		this.layoutService.removeAllCustomLayouts();
		this.update();
	}

	sortBy(column: number) {
		this.sortColumn.set(column);
		const sortDesc = this.sortDesc();
		this.layouts.set([...this.layouts()].sort((a, b) => {
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
			return (sortDesc ? 1 : -1) * result;
		}));
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
		this.test.update(test => ({ ...test, [layout.id]: undefined }));
		let finished = false;
		const worker = this.workerService.solve(layout.mapping, 10, progress => {
			this.test.update(test => ({ ...test, [layout.id]: { win: progress[0], fail: progress[1] } }));
		}, finish => {
			finished = true;
			this.test.update(test => ({ ...test, [layout.id]: { win: finish[0], fail: finish[1] } }));
			this.worker = undefined;
			if (callback) {
				callback();
			}
		});
		if (!finished) {
			this.worker = worker;
		}
	}

	testLayouts(_event: MouseEvent): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = undefined;
			return;
		}
		this.testNextLayout();
	}

	testNextLayout(): void {
		const next = this.layouts().find(l => !this.test()[l.id]);
		if (next) {
			this.startTestLayout(next, () => {
				this.testNextLayout();
			});
		}
	}
}
