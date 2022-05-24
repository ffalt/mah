import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Layout} from '../../../../model/types';
import {LocalstorageService} from '../../../../service/localstorage.service';
import {LayoutService} from '../../../../service/layout.service';

export interface LayoutItem {
	layout: Layout;
	visible: boolean;
	playCount?: number;
	bestTime?: number;
	selected?: boolean;
}

export interface LayoutGroup {
	name: string;
	layouts: Array<LayoutItem>;
	visible: boolean;
}

@Component({
	selector: 'app-layout-list',
	templateUrl: './layout-list.component.html',
	styleUrls: ['./layout-list.component.scss']
})
export class LayoutListComponent implements OnInit, OnChanges {
	@Input() layouts: Array<Layout>;
	@Output() readonly startEvent = new EventEmitter<Layout>();
	groups: Array<LayoutGroup> = [];

	constructor(private storage: LocalstorageService, private translate: TranslateService, private layoutService: LayoutService) {
		if (this.layouts) {
			this.buildGroups();
		}
	}

	ngOnInit(): void {
		this.refresh();
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.refresh();
	}

	refresh(): void {
		if (this.layouts) {
			this.buildGroups();
			setTimeout(() => {
				this.selectLastPlayed();
			});
		}
	}

	onStart(layout: Layout): void {
		if (layout) {
			this.startEvent.emit(layout);
		}
	}

	buildGroups(): void {
		const groups: Array<LayoutGroup> = [];
		const g: { [name: string]: LayoutGroup } = {};
		for (const layout of this.layoutService.layouts.items) {
			if (!g[layout.category]) {
				g[layout.category] = {name: layout.category, layouts: [], visible: false};
				groups.push(g[layout.category]);
			}
			const score = this.storage.getScore(layout.id) || {};
			g[layout.category].layouts.push({layout, playCount: score.playCount, bestTime: score.bestTime, visible: false});
		}
		this.groups = groups;
	}

	scrollToGroup(index: number): void {
		const elements = document.getElementById(`group-${index}`);
		if (elements) {
			elements.scrollIntoView();
		}
	}

	scrollToItem(id: string): void {
		const elements = document.getElementById(`item-${id}`);
		if (elements) {
			elements.scrollIntoView();
		}
	}

	selectLastPlayed(): void {
		const id = this.storage.getLastPlayed();
		if (id) {
			this.groups.forEach(g => {
				g.layouts.forEach(layout => {
					layout.selected = layout.layout.id === id;
				});
			});
			this.scrollToItem(id);
		}
	}

	clearBestTimeClick(event: MouseEvent, layout: LayoutItem): void {
		event.stopPropagation();
		if (confirm(this.translate.instant('BEST_TIME_CLEAR_SURE'))) {
			this.storage.clearScore(layout.layout.id);
			layout.bestTime = undefined;
			layout.playCount = undefined;
		}
	}

}
