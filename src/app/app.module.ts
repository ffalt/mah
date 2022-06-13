import {HttpClientModule} from '@angular/common/http';
import {Injectable, NgModule} from '@angular/core';
import {BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule} from '@angular/platform-browser';
import {TranslateModule} from '@ngx-translate/core';

import {environment} from '../environments/environment';
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

declare let Hammer: any;

@Injectable()
export class CustomHammerConfig extends HammerGestureConfig {
	overrides = {
		pan: {
			enable: true,
			direction: Hammer.DIRECTION_ALL,
			threshold: 5
		},
		pinch: {enable: true},
		press: {enable: false},
		rotate: {enable: false},
		swipe: {enable: false},
		tap: {enable: false}
	} as any;
}

@NgModule({
	imports: [
		BrowserModule,
		HttpClientModule,
		HammerModule,
		CoreModule,
		TranslateModule.forRoot(),
		...environment.modules
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
		SvgdefService,
		{
			provide: HAMMER_GESTURE_CONFIG,
			useClass: CustomHammerConfig
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {
}
