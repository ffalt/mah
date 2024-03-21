import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {CoreModule} from '../core/core.module';
import {EditorComponent} from './components/editor/editor.component';
import {LayoutComponent} from './components/layout/layout.component';
import {BoardComponent} from './components/board/board.component';
import {ExportComponent} from './components/export/export.component';
import {DropZoneDirective} from './directives/drop-zone.directive';
import {ImportComponent} from './components/import/import.component';
import {ManagerComponent} from './components/manager/manager.component';

@NgModule({
	imports: [CommonModule, CoreModule, TranslateModule],
	declarations: [
		EditorComponent,
		LayoutComponent,
		BoardComponent,
		ManagerComponent,
		ExportComponent,
		ImportComponent,
		DropZoneDirective
	],
	providers: []
})
export class EditorModule {

	static getEditorComponentComponent() {
		return EditorComponent;
	}

}
