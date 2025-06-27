import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Layout, LoadLayout} from '../../../../model/types';
import {LayoutService} from '../../../../service/layout.service';
import {downloadLayout, generateExportKmahjongg, generateExportKyodai, generateExportLayout, generateExportMah} from '../../model/export';
import {EditLayout} from '../../model/edit-layout';

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
    standalone: false
})
export class ExportComponent implements OnInit, OnChanges {
	@Input() layout: EditLayout;
	@Output() readonly savedEvent = new EventEmitter<boolean>();
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
	output: string;
	filename: string;
	translate = inject(TranslateService);
	layoutService = inject(LayoutService);

	ngOnInit(): void {
		if (this.layout) {
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
		this.layout.originalId = this.exportLayout.id;
		this.savedEvent.emit(true);
	}

	save(): void {
		if (this.layoutService.layouts.items.find(l => !l.custom && l.id === this.exportLayout.id)) {
			alert(this.translate.instant('EDITOR_BUILD_IN_EXISTS'));
			return;
		}
		const removeIDs = [this.exportLayout.id];
		if (this.layout.originalId) {
			removeIDs.push(this.layout.originalId);
		}
		this.layoutService.removeCustomLayout(removeIDs);
		this.saveAsCopy();
	}

	chooseFormat(ef: Format): void {
		this.format = ef;
		this.update();
	}

	download(): void {
		downloadLayout(this.filename, this.output, this.format.type);
		this.savedEvent.emit(true);
	}

	update(): void {
		this.layoutName = this.layout.name.toLocaleLowerCase().replace(/ /g, '_');
		this.output = this.format.func(this.layout);
		this.filename = `${this.layoutName}.${this.format.ext}`;
		this.exportLayout = generateExportLayout(this.layout);
	}
}
