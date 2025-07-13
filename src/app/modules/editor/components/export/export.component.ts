import { Component, type OnChanges, type OnInit, type SimpleChanges, inject, input, output } from '@angular/core';
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

@Component({
	selector: 'app-editor-export-component',
	templateUrl: './export.component.html',
	styleUrls: ['./export.component.scss'],
	imports: [LayoutPreviewComponent, TranslatePipe]
})
export class ExportComponent implements OnInit, OnChanges {
	readonly layout = input.required<EditLayout>();
	readonly savedEvent = output<boolean>();
	exportFormats: Array<Format> = [
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
	format: Format = this.exportFormats[0];
	exportLayout: LoadLayout;
	layoutName: string;
	result: string;
	filename: string;
	translate = inject(TranslateService);
	layoutService = inject(LayoutService);

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
		this.layoutService.storeCustomBoards([this.exportLayout]);
		const layout = this.layout();
		layout.originalId = this.exportLayout.id;
		this.savedEvent.emit(true);
	}

	save(): void {
		if (this.layoutService.layouts.items.find(l => !l.custom && l.id === this.exportLayout.id)) {
			alert(this.translate.instant('EDITOR_BUILD_IN_EXISTS'));
			return;
		}
		const removeIDs = [this.exportLayout.id];
		const layout = this.layout();
		if (layout.originalId) {
			removeIDs.push(layout.originalId);
		}
		this.layoutService.removeCustomLayout(removeIDs);
		this.saveAsCopy();
	}

	chooseFormat(ef: Format): void {
		this.format = ef;
		this.update();
	}

	download(): void {
		downloadLayout(this.filename, this.result, this.format.type);
		this.savedEvent.emit(true);
	}

	update(): void {
		const layout = this.layout();
		this.layoutName = layout.name.toLocaleLowerCase().replace(/ /g, '_');
		this.result = this.format.func(layout);
		this.filename = `${this.layoutName}.${this.format.ext}`;
		this.exportLayout = generateExportLayout(layout);
	}
}
