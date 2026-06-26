import { Component, type OnChanges, type OnInit, type SimpleChanges, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
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
	changeDetection: ChangeDetectionStrategy.OnPush,
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
		if (!exportLayout) {
			return;
		}
		this.layoutService.storeCustomBoards([exportLayout]);
		const layout = this.layout();
		layout.originalId = exportLayout.id;
		this.savedEvent.emit(true);
	}

	save(): void {
		const exportLayout = this.exportLayout();
		if (!exportLayout) {
			return;
		}
		if (this.layoutService.layouts.items.some(l => !l.custom && l.id === exportLayout.id)) {
			alert(this.translate.instant('EDITOR_BUILD_IN_EXISTS'));
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

	update(): void {
		const layout = this.layout();
		const format = this.format();
		const layoutName = layout.name.toLocaleLowerCase().replace(/ /g, '_');
		this.result.set(format.func(layout));
		this.filename.set(`${layoutName}.${format.ext}`);
		this.exportLayout.set(generateExportLayout(layout));
	}
}
