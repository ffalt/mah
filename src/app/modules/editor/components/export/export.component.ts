import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Layout} from '../../../../model/types';
import {LayoutService} from '../../../../service/layout.service';
import {downloadLayout, generateExportKmahjongg, generateExportKyodai, generateExportLayout, generateExportMah} from '../../model/export';

interface Format {
	name: string;
	ext: string;
	func: (layout: Layout) => string;
	type: string;
}

@Component({
	selector: 'app-editor-export-component',
	templateUrl: './export.component.html',
	styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit, OnChanges {
	@Input() layout: Layout;
	@Output() readonly savedEvent = new EventEmitter<void>();
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
	layoutName: string;
	output: string;
	filename: string;

	constructor(private layoutService: LayoutService) {
	}

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

	save(): void {
		const exportLayout = generateExportLayout(this.layout);
		if (this.layoutService.layouts.items.find(l => !l.custom && l.id === exportLayout.id)) {
			alert('Similar (build-in) layout already in Game!');
			return;
		} else if (this.layoutService.layouts.items.find(l => l.custom && l.id === exportLayout.id)) {
			this.layoutService.removeCustomLayout([exportLayout.id]);
			this.layoutService.storeCustomBoards([exportLayout]);
		} else {
			this.layoutService.storeCustomBoards([exportLayout]);
		}
		this.savedEvent.emit();
	}

	chooseFormat(ef: Format): void {
		this.format = ef;
		this.update();
	}

	download(): void {
		downloadLayout(this.filename, this.output, this.format.type);
	}

	update(): void {
		this.layoutName = this.layout.name.toLocaleLowerCase().replace(/ /g, '_');
		this.output = this.format.func(this.layout);
		this.filename = `${this.layoutName}.${this.format.ext}`;
	}
}
