import { Component, inject, model, output } from '@angular/core';
import { type BUILD_MODE_ID, BuilderModes, MODE_SOLVABLE } from '../../model/builder';
import type { Layout } from '../../model/types';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import { type GAME_MODE_ID, GameModes } from '../../model/consts';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutListComponent } from '../layout-list/layout-list.component';

export interface StartEvent {
	layout: Layout;
	buildMode: BUILD_MODE_ID;
	gameMode: GAME_MODE_ID;
}

@Component({
	selector: 'app-choose-layout',
	templateUrl: './choose-layout.component.html',
	styleUrls: ['./choose-layout.component.scss'],
	imports: [LayoutListComponent, TranslatePipe]
})
export class ChooseLayoutComponent {
	readonly startEvent = output<StartEvent>();
	readonly gameMode = model.required<GAME_MODE_ID>();
	buildMode: BUILD_MODE_ID = MODE_SOLVABLE;
	buildModes = BuilderModes;
	gameModes = GameModes;
	layoutService = inject(LayoutService);
	storage = inject(LocalstorageService);

	onStart(layout: Layout): void {
		if (layout) {
			this.startEvent.emit({ layout, buildMode: this.buildMode, gameMode: this.gameMode() });
			this.storage.storeLastPlayed(layout.id);
		}
	}

	randomGame(): void {
		const index = Math.floor(Math.random() * this.layoutService.layouts.items.length);
		this.onStart(this.layoutService.layouts.items[index]);
	}
}
