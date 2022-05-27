import {HttpClientModule} from '@angular/common/http';
import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {TranslateModule} from '@ngx-translate/core';

import {AppComponent} from './app.component';
import {ChooseLayoutComponent} from './components/choose-layout/choose-layout.component';
import {GameComponent} from './components/game/game-component.component';
import {HelpComponent} from './components/help/help.component';
import {SettingsComponent} from './components/settings/settings.component';
import {TileComponent} from './components/tile/tile.component';
import {TilesInfoComponent} from './components/tiles-info/tiles-info.component';
import {AppService} from './service/app.service';
import {LayoutService} from './service/layout.service';
import {SvgdefService} from './service/svgdef.service';
import {CoreModule} from './modules/core/core.module';
import {WorkerService} from './service/worker.service';

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		CoreModule,
		TranslateModule.forRoot()
	],
	declarations: [
		AppComponent,
		ChooseLayoutComponent,
		GameComponent,
		HelpComponent,
		TilesInfoComponent,
		TileComponent,
		SettingsComponent
	],
	providers: [
		AppService,
		LayoutService,
		WorkerService,
		SvgdefService
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
