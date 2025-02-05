import {Component, EventEmitter, Output, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {LayoutService} from '../../../../service/layout.service';
import {LayoutComponent} from '../layout/layout.component';
import {downloadMahLayouts} from '../../model/export';
import {EditLayout} from '../../model/edit-layout';
import {Layout} from '../../../../model/types';

@Component({
    selector: 'app-editor-component',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss'],
    standalone: false
})
export class EditorComponent {
	mode = 'manager';
	layout?: EditLayout;
	@Output() readonly closeEvent = new EventEmitter();
	@ViewChild(LayoutComponent, {static: false}) layoutComponent?: LayoutComponent;

	constructor(public layoutService: LayoutService, private translate: TranslateService) {
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
		const hasChanged = this.layout && this.layoutComponent && this.layoutComponent.hasChanged;
		if (!hasChanged || confirm(this.translate.instant('EDITOR_DISCARD_CHANGES_SURE'))) {
			this.layout = undefined;
			this.mode = 'manager';
		}
	}

	editLayout(layout: Layout) {
		this.mode = 'edit';
		this.layout = {
			id: '',
			originalId: layout.id,
			name: layout.name,
			by: layout.by || '',
			category: (layout.custom ? layout.category : undefined) || 'Custom',
			mapping: layout.mapping.map(m => [m[0], m[1], m[2]])
		};
	}

	exportLayouts() {
		downloadMahLayouts(this.layoutService.layouts.items);
	}

	newLayout() {
		this.editLayout({
			id: '',
			name: 'New Board',
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
