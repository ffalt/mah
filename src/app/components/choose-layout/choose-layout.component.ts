import { Component, ElementRef, effect, inject, model, output, signal, ChangeDetectionStrategy } from '@angular/core';
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
	changeDetection: ChangeDetectionStrategy.OnPush,
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
	readonly layoutService = inject(LayoutService);
	readonly storage = inject(LocalstorageService);
	private readonly elementRef = inject(ElementRef);
	private previousFocus: Element | null = null;

	constructor() {
		effect(() => {
			if (this.activeInfo()) {
				this.previousFocus = document.activeElement;
				setTimeout(() => {
					const popup = (this.elementRef.nativeElement as HTMLElement).querySelector<HTMLElement>('.info-popup');
					popup?.querySelector<HTMLElement>('button')?.focus();
				}, 0);
			} else {
				if (this.previousFocus instanceof HTMLElement) {
					this.previousFocus.focus();
				}
				this.previousFocus = null;
			}
		});
	}

	onGameModeChange(mode: GAME_MODE_ID): void {
		this.gameMode.set(mode);
		this.buildMode.set(MODE_SOLVABLE);
	}

	onStart(layout: Layout): void {
		if (!layout) {
			return;
		}

		this.startEvent.emit({ layout, buildMode: this.buildMode(), gameMode: this.gameMode() });
		this.storage.storeLastPlayed(layout.id);
	}

	openGeneratorInfo(event: Event): void {
		this.openInfo(event, 'generator');
	}

	openModeInfo(event: Event): void {
		this.openInfo(event, 'mode');
	}

	openInfo(event: Event, key: 'generator' | 'mode'): void {
		event.preventDefault();
		this.activeInfo.set(key);
	}

	closeInfo(): void {
		this.activeInfo.set(null);
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
