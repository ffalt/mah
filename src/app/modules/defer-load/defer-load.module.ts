import { CommonModule } from '@angular/common';
import { type ModuleWithProviders, NgModule } from '@angular/core';
import { DeferLoadScrollHostDirective } from './defer-load-scroll-host.directive';
import { DeferLoadDirective } from './defer-load.directive';
import { DeferLoadService } from './defer-load.service';

@NgModule({
	imports: [CommonModule],
	declarations: [DeferLoadDirective, DeferLoadScrollHostDirective],
	exports: [DeferLoadDirective, DeferLoadScrollHostDirective],
	providers: [DeferLoadService]
})
export class DeferLoadModule {
	static forRoot(): ModuleWithProviders<DeferLoadModule> {
		return {
			ngModule: DeferLoadModule
		};
	}
}
