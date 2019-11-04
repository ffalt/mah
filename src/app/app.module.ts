import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {TranslateModule} from '@ngx-translate/core';

import {AppComponent} from './app.component';
import {BoardComponent} from './components/board/board.component';
import {ChooseLayoutComponent} from './components/choose-layout/choose-layout.component';
import {GameComponent} from './components/game/game-component.component';
import {HelpComponent} from './components/help/help.component';
import {ImageSetLoaderComponent} from './components/image-set-loader/image-set-loader.component';
import {LayoutPreviewComponent} from './components/layout-preview/layout-preview.component';
import {SettingsComponent} from './components/settings/settings.component';
import {TileComponent} from './components/tile/tile.component';
import {TilesInfoComponent} from './components/tiles-info/tiles-info.component';
import {DropZoneDirective} from './directives/drop-zone.directive';
import {DeferLoadModule} from './modules/defer-load';
import {DurationPipe} from './pipes/duration.pipe';
import {PrefixPipe} from './pipes/prefix.pipe';
import {AppService} from './service/app.service';
import {LayoutService} from './service/layout.service';
import {SvgdefService} from './service/svgdef.service';

@NgModule({
	imports: [
		BrowserModule,
		FormsModule,
		HttpClientModule,
		DeferLoadModule.forRoot(),
		TranslateModule.forRoot()
	],
	declarations: [
		AppComponent,
		ChooseLayoutComponent,
		GameComponent,
		HelpComponent,
		LayoutPreviewComponent,
		BoardComponent,
		DurationPipe,
		PrefixPipe,
		TilesInfoComponent,
		TileComponent,
		ImageSetLoaderComponent,
		SettingsComponent,
		DropZoneDirective
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
