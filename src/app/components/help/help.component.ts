import { Component, inject, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { clickExternalHref } from '../../model/external-links';
import { GameModes } from '../../model/consts';
import { DurationPipe } from '../../pipes/duration.pipe';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';

interface StatEntry {
	name: string;
	playCount: number;
	bestTime?: number;
}

interface StatGroup {
	name: string;
	items: Array<StatEntry>;
}

@Component({
	selector: 'app-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss'],
	imports: [TranslatePipe, DurationPipe]
})
export class HelpComponent {
	readonly showTutorial = output();
	readonly gameModes = GameModes;

	private readonly layoutService = inject(LayoutService);
	private readonly storage = inject(LocalstorageService);
	private _statsGroups?: Array<StatGroup>;

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

	get statsGroups(): Array<StatGroup> {
		return this._statsGroups ??= this.buildStatsGroups();
	}

	private buildStatsGroups(): Array<StatGroup> {
		const groups = new Map<string, StatGroup>();
		for (const layout of this.layoutService.layouts.items) {
			const score = this.storage.getScore(layout.id);
			if (!score?.playCount) {
				continue;
			}
			let group = groups.get(layout.category);
			if (!group) {
				group = { name: layout.category, items: [] };
				groups.set(layout.category, group);
			}
			group.items.push({ name: layout.name, playCount: score.playCount, bestTime: score.bestTime });
		}
		return Array.from(groups.values());
	}

	protected readonly clickExternalHref = clickExternalHref;
}