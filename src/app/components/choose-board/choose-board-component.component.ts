import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Builder} from '../../model/builder';
import {cleanImportLayout, convertKyodai} from '../../model/import';
import {Layout, Layouts} from '../../model/layouts';

@Component({
	selector: 'app-choose-board-component',
	templateUrl: './choose-board-component.component.html',
	styleUrls: ['./choose-board-component.component.scss']
})
export class ChooseBoardComponent {
	@Input() layouts: Layouts;
	@Output() readonly startEvent = new EventEmitter<{ layout: Layout, mode: string }>();
	focusIndex: number = 0;
	loadedSVG: { [index: number]: boolean } = {};
	mode: string = 'MODE_SOLVABLE';
	builder: Builder = new Builder();

	constructor() {
		for (let i = 0; i < 20; i++) {
			this.loadedSVG[i] = true;
		}
	}

	onStart(layout: Layout): void {
		if (layout) {
			this.startEvent.emit({layout, mode: this.mode});
		}
	}

	randomGame(): void {
		this.focusIndex = Math.floor(Math.random() * this.layouts.items.length);
		this.startEvent.emit({layout: this.layouts.items[this.focusIndex], mode: this.mode});
	}

	loadSVG(i: number): void {
		setTimeout(() => {
			this.loadedSVG[i] = true;
		});
	}

	async readFile(file: File): Promise<string> {
		const reader = new FileReader();
		return new Promise<string>((resolve, reject) => {
			reader.onload = () => {
				resolve(reader.result as string);
			};
			reader.onerror = e => {
				reject(e);
			};
			reader.readAsBinaryString(file);
		});
	}

	async importFile(file: File): Promise<void> {
		const s = await this.readFile(file);
		let layout = await convertKyodai(s);
		layout = await cleanImportLayout(layout);
		// TODO: generate preview for imported layout
		this.layouts.items.push({...layout, index: this.layouts.items.length});
	}

	onDrop(files: Array<File>): void {
		this.importFile(files[0]).catch(e => {
			alert(e);
		});
	}
}
