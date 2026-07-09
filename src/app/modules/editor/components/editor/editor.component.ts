import { Component, inject, output, signal, viewChild } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LayoutService } from '../../../../service/layout.service';
import { LayoutComponent } from '../layout/layout.component';
import { downloadMahLayouts } from '../../model/export';
import type { EditLayout } from '../../model/edit-layout';
import type { Layout } from '../../../../model/types';
import { ImportComponent } from '../import/import.component';
import { ManagerComponent } from '../manager/manager.component';
import { IconCloseComponent } from '../../../../components/icons/icon-close.component';
import { IconLogoComponent } from '../../../../components/icons/icon-logo.component';
import { DropZoneDirective } from '../../directives/drop-zone.directive';

@Component({
	selector: 'app-editor-component',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss'],
	imports: [DropZoneDirective, LayoutComponent, IconLogoComponent, ImportComponent, ManagerComponent, TranslatePipe, IconCloseComponent]
})
export class EditorComponent {
	readonly closeEvent = output();
	readonly layoutComponent = viewChild(LayoutComponent);
	readonly mode = signal('manager');
	readonly layout = signal<EditLayout | undefined>(undefined);
	readonly layoutService = inject(LayoutService);
	readonly translate = inject(TranslateService);

	save() {
		const layoutComponent = this.layoutComponent();
		if (layoutComponent) {
			layoutComponent.toggleSave();
		}
	}

	close() {
		if (this.mode() === 'manager') {
			this.closeEvent.emit();
			return;
		}
		const layoutComponent = this.layoutComponent();
		const hasChanged = this.layout() && layoutComponent?.hasChanged;
		if (!hasChanged || confirm(this.translate.instant('EDITOR_DISCARD_CHANGES_SURE'))) {
			this.layout.set(undefined);
			this.mode.set('manager');
		}
	}

	editLayout(layout: Layout) {
		this.mode.set('edit');
		this.layout.set({
			id: '',
			originalId: layout.id,
			name: layout.name,
			by: layout.by ?? '',
			category: (layout.custom ? layout.category : undefined) ?? 'Custom',
			mapping: layout.mapping.map(m => [m[0], m[1], m[2]])
		});
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
		this.mode.set('import');
	}
}
