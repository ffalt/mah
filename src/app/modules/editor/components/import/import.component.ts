import { Component, inject, output } from '@angular/core';
import type { Layout, LoadLayout } from '../../../../model/types';
import { LayoutService } from '../../../../service/layout.service';
import { importLayouts } from '../../model/import';

@Component({
	selector: 'app-import-component',
	templateUrl: './import.component.html',
	styleUrls: ['./import.component.scss'],
	standalone: false
})
export class ImportComponent {
	readonly editEvent = output<Layout>();
	layoutService = inject(LayoutService);
	logs: Array<{ msg: string; isError?: boolean; id?: string }> = [];

	selectFiles(event: Event): void {
		const element = event.currentTarget as HTMLInputElement;
		const fileList: FileList | null = element.files;
		if (fileList) {
			this.importFiles(Array.from(fileList));
		}
	}

	async importLayouts(files: Array<File>): Promise<void> {
		this.logs = [];
		const imported: Array<LoadLayout> = [];
		for (const file of files) {
			try {
				const loadLayouts: Array<LoadLayout> = await importLayouts(file);
				for (const loadLayout of loadLayouts) {
					const layout = this.layoutService.expandLayout(loadLayout, true);
					if (
						!this.layoutService.layouts.items.find(l => l.id === layout.id) &&
						!imported.find(l => l.id === layout.id)
					) {
						imported.push(LayoutService.layout2loadLayout(layout, loadLayout.map));
						this.logs.push({ msg: `Imported: "${file.name}"`, id: layout.id });
					} else {
						console.error(`Similar layout to "${layout.name}" already available. Import rejected`);
						this.logs.push({ msg: `Similar layout to "${layout.name}" already available. Import rejected.`, isError: true });
					}
				}
			} catch (e) {
				console.error('Error importing', file, e);
				this.logs.push({ msg: `ERROR importing "${file.name}". Invalid file.`, isError: true });
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
			.catch(e => {
				console.error(e);
			});
	}

	onDropFiles(files: Array<File>): void {
		this.importFiles(files);
	}

}
