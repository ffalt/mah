import { type ModuleWithProviders, NgModule, NgZone, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { AppService } from '../../../src/app/service/app.service';

@NgModule({
	imports: [],
	providers: []
})
export class CapacitorModule {
	private ngZone = inject(NgZone);
	private app = inject(AppService);

	constructor() {
		App.addListener('appStateChange', ({ isActive }) => {
			if (!isActive) {
				this.ngZone.run(() => {
					if (this.app.game.isRunning()) {
						this.app.game.pause();
					}
				});
			}
		});
	}

	static forRoot(): ModuleWithProviders<CapacitorModule> {
		return {
			ngModule: CapacitorModule
		};
	}
}
