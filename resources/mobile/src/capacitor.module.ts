import { type ModuleWithProviders, NgModule, NgZone, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { AppService } from '../../../src/app/service/app.service';

@NgModule({
	imports: [],
	providers: []
})
export class CapacitorModule {
	private readonly ngZone = inject(NgZone);
	private readonly app = inject(AppService);

	constructor() {
		this.init();
	}

	init() {
		App.addListener('appStateChange', ({ isActive }) => {
			if (!isActive) {
				this.ngZone.run(() => {
					if (this.app.game.isRunning()) {
						this.app.game.pause();
					}
				});
			}
		}).catch(error => console.error(error));
	}

	static forRoot(): ModuleWithProviders<CapacitorModule> {
		return {
			ngModule: CapacitorModule
		};
	}
}
