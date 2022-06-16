import {ModuleWithProviders, NgModule, NgZone} from '@angular/core';
import {App} from '@capacitor/app';
import {AppService} from '../../../src/app/service/app.service';

@NgModule({
	imports: [],
	providers: []
})
export class CapacitorModule {

	constructor(private ngZone: NgZone, private app: AppService) {
		console.error('CapacitorService');
		App.addListener('appStateChange', ({isActive}) => {
			if (!isActive) {
				this.ngZone.run(() => {
					if (this.app.game.isRunning()) {
						app.game.pause();
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
