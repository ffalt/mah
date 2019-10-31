import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {TranslateModule} from '@ngx-translate/core';

import {AppComponent} from './app.component';
import {BoardComponent} from './components/board/board.component';
import {ChooseBoardComponent} from './components/choose-board/choose-board-component.component';
import {GameComponent} from './components/game/game-component.component';
import {HelpComponent} from './components/help/help.component';
import {ImageSetLoaderComponent} from './components/image-set-loader/image-set-loader.component';
import {LayoutListItemComponent} from './components/layout-list-item/layout-list-item.component';
import {LayoutListComponent} from './components/layout-list/layout-list.component';
import {LayoutPreviewComponent} from './components/layout-preview/layout-preview.component';
import {SettingsComponent} from './components/settings/settings.component';
import {TileComponent} from './components/tile/tile.component';
import {TilesInfoComponent} from './components/tiles-info/tiles-info.component';
import {DeferLoadModule} from './modules/defer-load';
import {DurationPipe} from './pipes/duration.pipe';
import {AppService} from './service/app.service';
import {LayoutService} from './service/layout.service';
import {SvgdefService} from './service/svgdef.service';

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule,
		DeferLoadModule,
		TranslateModule.forRoot()
	],
	declarations: [
		AppComponent,
		ChooseBoardComponent,
		GameComponent,
		HelpComponent,
		LayoutListComponent,
		LayoutListItemComponent,
		LayoutPreviewComponent,
		BoardComponent,
		DurationPipe,
		TilesInfoComponent,
		TileComponent,
		ImageSetLoaderComponent,
		SettingsComponent
	],
	providers: [
		AppService,
		LayoutService,
		SvgdefService
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
