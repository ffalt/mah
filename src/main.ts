import { enableProdMode, importProvidersFrom } from '@angular/core';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';

import { AppService } from './app/service/app.service';
import { LayoutService } from './app/service/layout.service';
import { WorkerService } from './app/service/worker.service';
import { DeferLoadService } from './app/directives/defer-load/defer-load.service';
import { SvgdefService } from './app/service/svgdef.service';

if (environment.production) {
	enableProdMode();
}

bootstrapApplication(AppComponent, {
	providers: [
		importProvidersFrom(
			BrowserModule,
			TranslateModule.forRoot(),
			CommonModule,
			...environment.modules
		),
		AppService,
		LayoutService,
		WorkerService,
		DeferLoadService,
		SvgdefService,
		provideHttpClient(withInterceptorsFromDi()),
		provideAnimations()
	]
})
	.catch(console.error);
