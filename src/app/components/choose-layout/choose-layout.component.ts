import {Component, EventEmitter, Output} from '@angular/core';
import {BUILD_MODE_ID, Builder, MODE_SOLVABLE} from '../../model/builder';
import {Layout} from '../../model/types';
import {LayoutService} from '../../service/layout.service';
import {LocalstorageService} from '../../service/localstorage.service';

@Component({
	selector: 'app-choose-layout',
	templateUrl: './choose-layout.component.html',
	styleUrls: ['./choose-layout.component.scss']
})
export class ChooseLayoutComponent {
	@Output() readonly startEvent = new EventEmitter<{ layout: Layout; mode: BUILD_MODE_ID }>();
	mode: BUILD_MODE_ID = MODE_SOLVABLE;
	builder: Builder = new Builder();

	constructor(public layoutService: LayoutService, private storage: LocalstorageService) {
	}

	onStart(layout: Layout): void {
		if (layout) {
			this.startEvent.emit({layout, mode: this.mode});
			this.storage.storeLastPlayed(layout.id);
		}
	}

	randomGame(): void {
		const index = Math.floor(Math.random() * this.layoutService.layouts.items.length);
		this.onStart(this.layoutService.layouts.items[index]);
	}
}
