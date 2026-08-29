import { Component, inject, output, signal } from '@angular/core';
import type { Layout, LoadLayout } from '../../../../model/types';
import { LayoutService } from '../../../../service/layout.service';
import { log } from '../../../../model/log';
import { importLayouts } from '../../model/import';
import { TranslatePipe } from '@ngx-translate/core';
import { DropZoneDirective } from '../../directives/drop-zone.directive';
import { IconOkComponent } from '../../../../components/icons/icon-ok.component';

export interface ImportLog {
	key: string;
	params?: Record<string, string>;
	isError?: boolean;
	id?: string;
}

@Component({
	selector: 'app-import-component',
	templateUrl: './import.component.html',
	styleUrls: ['./import.component.scss'],
	imports: [TranslatePipe, DropZoneDirective, IconOkComponent]
})
export class ImportComponent {
	readonly editEvent = output<Layout>();
	readonly logs = signal<Array<ImportLog>>([]);
	readonly layoutService = inject(LayoutService);

	selectFiles(event: Event): void {
		const element = event.currentTarget as HTMLInputElement;
		const fileList: FileList | null = element.files;
		if (fileList) {
			this.importFiles(Array.from(fileList));
		}
		element.value = '';
	}

	async importLayouts(files: Array<File>): Promise<void> {
		this.logs.set([]);
		const imported: Array<LoadLayout> = [];
		for (const file of files) {
			try {
				const loadLayouts: Array<LoadLayout> = await importLayouts(file);
				for (const loadLayout of loadLayouts) {
					const layout = this.layoutService.expandLayout(loadLayout, true);
					if (
						this.layoutService.layouts.items.every(l => l.id !== layout.id) &&
						imported.every(l => l.id !== layout.id)
					) {
						imported.push(LayoutService.layout2loadLayout(layout, loadLayout.map));
						this.logs.update(logs => [...logs, { key: 'EDITOR_IMPORT_DONE', params: { file: file.name }, id: layout.id }]);
					} else {
						log.error(`Similar layout to "${layout.name}" already available. Import rejected`);
						this.logs.update(logs => [...logs, { key: 'EDITOR_IMPORT_DUPLICATE', params: { name: layout.name }, isError: true }]);
					}
				}
			} catch (error) {
				log.error('Error importing', file, error);
				this.logs.update(logs => [...logs, { key: 'EDITOR_IMPORT_INVALID', params: { file: file.name }, isError: true }]);
			}
		}
		if (imported.length > 0) {
			this.layoutService.storeCustomBoards(imported);
		}
	}

	selectLayout(id: string): void {
		const layout = this.layoutService.layouts.items.find(l => l.id === id);
		if (layout) {
			this.editEvent.emit(layout);
		}
	}

	importFiles(files: Array<File>): void {
		this.importLayouts(files)
			.catch(error => {
				log.error(error);
			});
	}

	onDropFiles(files: Array<File>): void {
		this.importFiles(files);
	}
}
