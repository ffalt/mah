import { Component, inject, output, type OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { clickExternalHref } from '../../model/external-links';
import { DurationPipe } from '../../pipes/duration.pipe';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';

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
	imports: [TranslatePipe, DurationPipe]
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

	shortcuts: Array<{ icon: string; key: string; altKey?: string; name: string }> = [
		{ icon: 'icon-lightbulb', key: 'T', name: 'HINT' },
		{ icon: 'icon-spin1', key: 'M', name: 'SHUFFLE' },
		{ icon: 'icon-undo', key: 'U', name: 'UNDO' },
		{ icon: 'icon-loop', key: 'N', name: 'RESTART' },
		{ icon: 'icon-pause', key: 'P', altKey: 'Space', name: 'PAUSE' },
		{ icon: 'icon-calendar', key: 'I', name: 'INFO' },
		{ icon: 'icon-cog', key: 'S', name: 'SETTINGS' },
		{ icon: 'icon-logo', key: 'H', name: 'HELP' }
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
				.catch(error => console.error(error));
		}
	}

	protected readonly clickExternalHref = clickExternalHref;
}
