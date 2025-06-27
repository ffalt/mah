import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { Injectable, NgModule } from '@angular/core';
import { BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig, HammerModule } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { ChooseLayoutComponent } from './components/choose-layout/choose-layout.component';
import { GameComponent } from './components/game/game-component.component';
import { HelpComponent } from './components/help/help.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TileComponent } from './components/tile/tile.component';
import { TilesInfoComponent } from './components/tiles-info/tiles-info.component';
import { AppService } from './service/app.service';
import { LayoutService } from './service/layout.service';
import { SvgdefService } from './service/svgdef.service';
import { CoreModule } from './modules/core/core.module';
import { WorkerService } from './service/worker.service';

declare let Hammer: HammerStatic;

@Injectable()
export class CustomHammerConfig extends HammerGestureConfig {
	overrides = {
		pan: {
			enable: true,
			direction: Hammer.DIRECTION_ALL,
			threshold: 15
		},
		pinch: { enable: true },
		press: { enable: false },
		rotate: { enable: false },
		swipe: { enable: false },
		tap: { enable: false }
	};
}

@NgModule({
	declarations: [
		AppComponent,
		ChooseLayoutComponent,
		GameComponent,
		HelpComponent,
		TilesInfoComponent,
		TileComponent,
		SettingsComponent
	],
	bootstrap: [AppComponent],
	imports: [BrowserModule,
		HammerModule,
		CoreModule,
		TranslateModule.forRoot(),
		...environment.modules
	],
	providers: [
		AppService,
		LayoutService,
		WorkerService,
		SvgdefService,
		{
			provide: HAMMER_GESTURE_CONFIG,
			useClass: CustomHammerConfig
		},
		provideHttpClient(withInterceptorsFromDi())
	]
})
export class AppModule {
}
