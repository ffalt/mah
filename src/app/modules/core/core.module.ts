import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TranslateModule} from '@ngx-translate/core';
import {DeferLoadModule} from '../defer-load';
import {BoardComponent} from './components/board/board.component';
import {ImageSetLoaderComponent} from './components/image-set-loader/image-set-loader.component';
import {DurationPipe} from './pipes/duration.pipe';
import {PrefixPipe} from './pipes/prefix.pipe';
import {LayoutListComponent} from './components/layout-list/layout-list.component';
import {LayoutPreviewComponent} from './components/layout-preview/layout-preview.component';
import {GameModeEasyPipe, GameModeStandardPipe} from './pipes/game-mode.pipe';
import {DialogComponent} from './components/dialog/dialog.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

const declarations = [
	ImageSetLoaderComponent,
	BoardComponent,
	LayoutListComponent,
	LayoutPreviewComponent,
	DialogComponent,
	DurationPipe,
	GameModeEasyPipe,
	GameModeStandardPipe,
	PrefixPipe
];

@NgModule({
	imports: [CommonModule, BrowserAnimationsModule, TranslateModule, DeferLoadModule.forRoot()],
	declarations,
	exports: declarations,
	providers: []
})
export class CoreModule {
}
