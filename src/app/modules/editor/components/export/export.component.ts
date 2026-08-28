import { Component, type OnChanges, type OnInit, type SimpleChanges, inject, input, output, signal } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Layout, LoadLayout } from '../../../../model/types';
import { LayoutService } from '../../../../service/layout.service';
import { downloadLayout, generateExportKmahjongg, generateExportKyodai, generateExportLayout, generateExportMah } from '../../model/export';
import type { EditLayout } from '../../model/edit-layout';
import { LayoutPreviewComponent } from '../../../../components/layout-preview/layout-preview.component';

interface Format {
	name: string;
	ext: string;
	func: (layout: Layout) => string;
	type: string;
}

const EXPORT_FORMATS = [
	{
		name: 'Mah',
		ext: 'mah',
		func: generateExportMah,
		type: 'text/json'
	},
	{
		name: 'Kyodai',
		ext: 'lay',
		func: generateExportKyodai,
		type: 'text/lay'
	},
	{
		name: 'Kmahjongg',
		ext: 'layout',
		func: generateExportKmahjongg,
		type: 'text/layout'
	}
];

@Component({
	selector: 'app-editor-export-component',
	templateUrl: './export.component.html',
	styleUrls: ['./export.component.scss'],
	imports: [LayoutPreviewComponent, TranslatePipe]
})
export class ExportComponent implements OnInit, OnChanges {
	readonly layout = input.required<EditLayout>();
	readonly savedEvent = output<boolean>();
	readonly exportFormats: Array<Format> = EXPORT_FORMATS;
	readonly format = signal<Format>(this.exportFormats[0]);
	readonly exportLayout = signal<LoadLayout | undefined>(undefined);
	readonly result = signal('');
	readonly filename = signal('');
	readonly translate = inject(TranslateService);
	readonly layoutService = inject(LayoutService);

	ngOnInit(): void {
		if (this.layout()) {
			this.update();
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.layout) {
			this.update();
		}
	}

	saveAsCopy(): void {
		const exportLayout = this.exportLayout();
		if (!exportLayout || this.blockedByBuiltIn(exportLayout.id)) {
			return;
		}
		this.layoutService.storeCustomBoards([exportLayout]);
		const layout = this.layout();
		layout.originalId = exportLayout.id;
		this.savedEvent.emit(true);
	}

	save(): void {
		const exportLayout = this.exportLayout();
		if (!exportLayout || this.blockedByBuiltIn(exportLayout.id)) {
			return;
		}
		const idsToRemove = [exportLayout.id];
		const layout = this.layout();
		if (layout.originalId) {
			idsToRemove.push(layout.originalId);
		}
		this.layoutService.removeCustomLayout(idsToRemove);
		this.saveAsCopy();
	}

	chooseFormat(ef: Format): void {
		this.format.set(ef);
		this.update();
	}

	download(): void {
		downloadLayout(this.filename(), this.result(), this.format().type);
		this.savedEvent.emit(true);
	}

	updateFileName(): void {
		const layoutName = this.layout().name.toLocaleLowerCase().replace(/ /g, '_');
		this.filename.set(`${layoutName}.${this.format().ext}`);
	}

	updateName(value: string): void {
		this.layout().name = value;
		this.updateFileName();
		this.updatePreview();
	}

	updateCat(value: string): void {
		this.layout().category = value;
		this.updatePreview();
	}

	updateBy(value: string): void {
		this.layout().by = value;
		this.updatePreview();
	}

	updatePreview(): void {
		const layout = this.layout();
		this.result.set(this.format().func(layout));
		this.exportLayout.set(generateExportLayout(layout));
	}

	update(): void {
		this.updateFileName();
		this.updatePreview();
	}

	private blockedByBuiltIn(id: string): boolean {
		if (this.layoutService.layouts.items.some(l => !l.custom && l.id === id)) {
			alert(this.translate.instant('EDITOR_BUILD_IN_EXISTS'));
			return true;
		}
		return false;
	}
}
