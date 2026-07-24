import { enableProdMode, importProvidersFrom, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';

import { AppService } from './app/service/app.service';
import { LayoutService } from './app/service/layout.service';
import { DeferLoadService } from './app/directives/defer-load/defer-load.service';
import { SvgdefService } from './app/service/svgdef.service';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

if (environment.production) {
	enableProdMode();
}

bootstrapApplication(AppComponent, {
	providers: [
		provideZonelessChangeDetection(),
		importProvidersFrom(
			BrowserModule,
			CommonModule,
			...environment.modules
		),
		provideTranslateService({
			loader: provideTranslateHttpLoader({ prefix: './assets/i18n/', suffix: '.json' }),
			fallbackLang: 'en'
		}),
		AppService,
		provideAppInitializer(async () => {
			await inject(AppService).preloadLang();
		}),
		LayoutService,
		DeferLoadService,
		SvgdefService,
		provideHttpClient(withInterceptorsFromDi())
	]
}).catch(console.error);
