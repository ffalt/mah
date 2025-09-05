import { enableProdMode, importProvidersFrom } from '@angular/core';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { provideTranslateService } from '@ngx-translate/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';

import { AppService } from './app/service/app.service';
import { LayoutService } from './app/service/layout.service';
import { WorkerService } from './app/service/worker.service';
import { DeferLoadService } from './app/directives/defer-load/defer-load.service';
import { SvgdefService } from './app/service/svgdef.service';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

if (environment.production) {
	enableProdMode();
}

bootstrapApplication(AppComponent, {
	providers: [
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
		LayoutService,
		WorkerService,
		DeferLoadService,
		SvgdefService,
		provideHttpClient(withInterceptorsFromDi()),
		provideAnimations()
	]
}).catch(console.error);
