import { Component, inject, output, input, model } from '@angular/core';
import { BUILD_MODE_ID, BuilderModes, MODE_SOLVABLE } from '../../model/builder';
import { Layout } from '../../model/types';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import { GAME_MODE_ID, GAME_MODE_STANDARD, GameModes } from '../../model/consts';

@Component({
	selector: 'app-choose-layout',
	templateUrl: './choose-layout.component.html',
	styleUrls: ['./choose-layout.component.scss'],
	standalone: false
})
export class ChooseLayoutComponent {
	readonly startEvent = output<{
		layout: Layout;
		buildMode: BUILD_MODE_ID;
		gameMode: GAME_MODE_ID;
	}>();
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
