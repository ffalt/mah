import { Component, InjectionToken, inject, output, viewChild } from '@angular/core';
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

// Injectable seam for the export helper so tests can supply a stub via DI
// instead of mocking the module.
export const EXPORT_API = new InjectionToken<{ downloadMahLayouts: typeof downloadMahLayouts }>('EXPORT_API', {
	providedIn: 'root',
	factory: () => ({ downloadMahLayouts })
});

@Component({
	selector: 'app-editor-component',
	templateUrl: './editor.component.html',
	styleUrls: ['./editor.component.scss'],
	imports: [LayoutComponent, IconLogoComponent, ImportComponent, ManagerComponent, TranslatePipe, IconCloseComponent]
})
export class EditorComponent {
	readonly closeEvent = output();
	readonly layoutComponent = viewChild(LayoutComponent);
	mode = 'manager';
	layout?: EditLayout;
	layoutService = inject(LayoutService);
	translate = inject(TranslateService);
	private readonly exportApi = inject(EXPORT_API);

	save() {
		const layoutComponent = this.layoutComponent();
		if (layoutComponent) {
			layoutComponent.toggleSave();
		}
	}

	close() {
		if (this.mode === 'manager') {
			this.closeEvent.emit();
			return;
		}
		const layoutComponent = this.layoutComponent();
		const hasChanged = this.layout && layoutComponent?.hasChanged;
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
			by: layout.by ?? '',
			category: (layout.custom ? layout.category : undefined) ?? 'Custom',
			mapping: layout.mapping.map(m => [m[0], m[1], m[2]])
		};
	}

	exportLayouts() {
		this.exportApi.downloadMahLayouts(this.layoutService.layouts.items);
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
