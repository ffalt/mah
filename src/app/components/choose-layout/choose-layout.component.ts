import { Component, inject, model, output, signal } from '@angular/core';
import { type BUILD_MODE_ID, BuilderModes, MODE_SOLVABLE } from '../../model/builder';
import type { Layout } from '../../model/types';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import { type GAME_MODE_ID, GameModes } from '../../model/consts';
import { TranslatePipe } from '@ngx-translate/core';
import { LayoutListComponent } from '../layout-list/layout-list.component';
import { IconInfoComponent } from '../icons/icon-info.component';
import { IconCloseComponent } from '../icons/icon-close.component';

export interface StartEvent {
	layout: Layout;
	buildMode: BUILD_MODE_ID;
	gameMode: GAME_MODE_ID;
}

@Component({
	selector: 'app-choose-layout',
	templateUrl: './choose-layout.component.html',
	styleUrls: ['./choose-layout.component.scss'],
	imports: [LayoutListComponent, TranslatePipe, IconInfoComponent, IconCloseComponent]
})
export class ChooseLayoutComponent {
	readonly startEvent = output<StartEvent>();
	readonly gameMode = model.required<GAME_MODE_ID>();
	readonly buildMode = model<BUILD_MODE_ID>(MODE_SOLVABLE);
	buildModes = BuilderModes;
	gameModes = GameModes;
	activeInfo = signal<'generator' | 'mode' | null>(null);
	layoutService = inject(LayoutService);
	storage = inject(LocalstorageService);

	onGameModeChange(mode: GAME_MODE_ID): void {
		this.gameMode.set(mode);
		this.buildMode.set(MODE_SOLVABLE);
	}

	onStart(layout: Layout): void {
		if (layout) {
			this.startEvent.emit({ layout, buildMode: this.buildMode(), gameMode: this.gameMode() });
			this.storage.storeLastPlayed(layout.id);
		}
	}

	randomGame(): void {
		const items = this.layoutService.layouts.items;
		if (items.length === 0) {
			return;
		}
		const index = Math.floor(Math.random() * items.length);
		this.onStart(items[index]);
	}
}
