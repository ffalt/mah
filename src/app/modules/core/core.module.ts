import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {FormsModule} from '@angular/forms';
import {DeferLoadModule} from '../defer-load';
import {BoardComponent} from './components/board/board.component';
import {ImageSetLoaderComponent} from './components/image-set-loader/image-set-loader.component';
import {DurationPipe} from './pipes/duration.pipe';
import {PrefixPipe} from './pipes/prefix.pipe';
import {LayoutListComponent} from './components/layout-list/layout-list.component';
import {LayoutPreviewComponent} from './components/layout-preview/layout-preview.component';

const declarations = [
	ImageSetLoaderComponent,
	BoardComponent,
	LayoutListComponent,
	LayoutPreviewComponent,
	DurationPipe,
	PrefixPipe
];

@NgModule({
	imports: [CommonModule, TranslateModule, FormsModule, DeferLoadModule.forRoot()],
	declarations,
	exports: declarations,
	providers: []
})
export class CoreModule {
}
