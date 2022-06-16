import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {Layout} from '../../../../model/types';
import {LayoutService} from '../../../../service/layout.service';
import {LayoutComponent} from '../layout/layout.component';
import {downloadMahLayouts} from '../../model/export';

@Component({
	selector: 'app-editor-component',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss']
})
export class EditorComponent {
	mode = 'manager';
	layout?: Layout;
	@Output() readonly closeEvent = new EventEmitter();
	@ViewChild(LayoutComponent, {static: false}) layoutComponent?: LayoutComponent;

	constructor(public layoutService: LayoutService) {
	}

	save() {
		if (this.layoutComponent) {
			this.layoutComponent.toggleSave();
		}
	}

	close() {
		if (this.mode === 'manager') {
			this.closeEvent.emit();
			return;
		}
		this.layout = undefined;
		this.mode = 'manager';
	}

	editLayout(layout: Layout) {
		this.mode = 'edit';
		this.layout = {
			id: '',
			name: layout.name,
			by: layout.by || '',
			category: layout.category || 'Custom',
			mapping: layout.mapping.map(m => [m[0], m[1], m[2]])
		};
	}

	exportLayouts() {
		downloadMahLayouts(this.layoutService.layouts.items);
	}

	newLayout() {
		this.editLayout({
			id: '',
			name: 'New Layout',
			category: 'Custom',
			by: '',
			mapping: []
		});
	}

	onDropFiles(): void {
		// nop
	}

	onDragFiles(): void {
		this.mode = 'import';
	}

}
