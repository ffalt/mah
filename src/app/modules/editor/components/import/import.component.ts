import { Component, inject, output, signal } from '@angular/core';
import type { Layout, LoadLayout } from '../../../../model/types';
import { LayoutService } from '../../../../service/layout.service';
import { log } from '../../../../model/log';
import { importLayouts } from '../../model/import';
import { TranslatePipe } from '@ngx-translate/core';
import { DropZoneDirective } from '../../directives/drop-zone.directive';
import { IconOkComponent } from '../../../../components/icons/icon-ok.component';

@Component({
	selector: 'app-import-component',
	templateUrl: './import.component.html',
	styleUrls: ['./import.component.scss'],
	imports: [TranslatePipe, DropZoneDirective, IconOkComponent]
})
export class ImportComponent {
	readonly editEvent = output<Layout>();
	readonly logs = signal<Array<{ msg: string; isError?: boolean; id?: string }>>([]);
	readonly layoutService = inject(LayoutService);

	selectFiles(event: Event): void {
		const element = event.currentTarget as HTMLInputElement;
		const fileList: FileList | null = element.files;
		if (fileList) {
			this.importFiles(Array.from(fileList));
		}
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
						this.logs.update(logs => [...logs, { msg: `Imported: "${file.name}"`, id: layout.id }]);
					} else {
						log.error(`Similar layout to "${layout.name}" already available. Import rejected`);
						this.logs.update(logs => [...logs, { msg: `Similar layout to "${layout.name}" already available. Import rejected.`, isError: true }]);
					}
				}
			} catch (error) {
				log.error('Error importing', file, error);
				this.logs.update(logs => [...logs, { msg: `ERROR importing "${file.name}". Invalid file.`, isError: true }]);
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
