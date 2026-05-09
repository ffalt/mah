import { Component, inject, output, type OnInit, type Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { clickExternalHref } from '../../model/external-links';
import { DurationPipe } from '../../pipes/duration.pipe';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import { log } from '../../model/log';
import { IconTilesinfoComponent } from '../icons/icon-tilesinfo.component';
import { IconSettingsComponent } from '../icons/icon-settings.component';
import { IconHintComponent } from '../icons/icon-hint.component';
import { IconLogoComponent } from '../icons/icon-logo.component';
import { IconRestartComponent } from '../icons/icon-restart.component';
import { IconPauseComponent } from '../icons/icon-pause.component';
import { IconShuffleComponent } from '../icons/icon-shuffle.component';
import { IconUndoComponent } from '../icons/icon-undo.component';

interface StatEntry {
	name: string;
	winCount?: number;
	loseCount?: number;
	bestTime?: number;
	averageTime?: number;
}

interface Stat {
	items: Array<StatEntry>;
	winCount: number;
	loseCount: number;
}

@Component({
	selector: 'app-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss'],
	imports: [TranslatePipe, DurationPipe, NgComponentOutlet]
})
export class HelpComponent implements OnInit {
	readonly showTutorial = output();
	stats: Stat = {
		items: [],
		winCount: 0,
		loseCount: 0
	};

	private readonly layoutService = inject(LayoutService);
	private readonly storage = inject(LocalstorageService);
	private readonly translate = inject(TranslateService);

	shortcuts: Array<{ icon: Type<unknown>; key: string; altKey?: string; name: string }> = [
		{ icon: IconHintComponent, key: 'T', name: 'HINT' },
		{ icon: IconShuffleComponent, key: 'M', name: 'SHUFFLE' },
		{ icon: IconUndoComponent, key: 'U', name: 'UNDO' },
		{ icon: IconRestartComponent, key: 'N', name: 'RESTART' },
		{ icon: IconPauseComponent, key: 'P', altKey: 'Space', name: 'PAUSE' },
		{ icon: IconTilesinfoComponent, key: 'I', name: 'TILES_INFO' },
		{ icon: IconSettingsComponent, key: 'S', name: 'SETTINGS' },
		{ icon: IconLogoComponent, key: 'H', name: 'HELP' }
	];

	ngOnInit(): void {
		this.stats = this.buildStats();
	}

	private buildStats(): Stat {
		const items = new Array<StatEntry>();
		let winCount = 0;
		let loseCount = 0;
		for (const layout of this.layoutService.layouts.items) {
			const score = this.storage.getScore(layout.id);
			if (!score) {
				continue;
			}
			winCount += score.winCount ?? 0;
			loseCount += score.loseCount ?? 0;
			items.push(
				{
					name: layout.name,
					winCount: score.winCount,
					loseCount: score.loseCount,
					bestTime: score.bestTime,
					averageTime: score.playTime && score.winCount && score.winCount > 0 ? (score.playTime / score.winCount) : undefined
				}
			);
		}
		return { winCount, loseCount, items };
	}

	async clearTimes(): Promise<void> {
		const layouts = await this.layoutService.get();
		for (const layout of layouts.items) {
			this.storage.clearScore(layout.id);
		}
	}

	clearTimesClick(): void {
		if (confirm(this.translate.instant('BEST_TIMES_CLEAR_SURE'))) {
			this.clearTimes()
				.then(() => {
					this.stats = {
						items: [],
						winCount: 0,
						loseCount: 0
					};
				})
				.catch(error => log.error(error));
		}
	}

	protected readonly clickExternalHref = clickExternalHref;
}
