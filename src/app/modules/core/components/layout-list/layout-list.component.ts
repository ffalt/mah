import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Layout } from '../../../../model/types';
import { LocalstorageService } from '../../../../service/localstorage.service';
import { LayoutService } from '../../../../service/layout.service';

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
    styleUrls: ['./layout-list.component.scss'],
    standalone: false
})
export class LayoutListComponent implements OnChanges {
	@Input() layouts?: Array<Layout>;
	@Output() readonly startEvent = new EventEmitter<Layout>();
	groups: Array<LayoutGroup> = [];
	private storage = inject(LocalstorageService);
	private translate = inject(TranslateService);
	private layoutService = inject(LayoutService);

	constructor() {
		if (this.layouts) {
			this.buildGroups();
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.refresh();
	}

	refresh(): void {
		if (this.layouts) {
			this.buildGroups();
			let id = this.storage.getLastPlayed();
			const boardID = this.layoutService.selectBoardID;
			this.layoutService.selectBoardID = undefined;
			if (boardID && this.layouts.find(l => l.id === boardID)) {
				id = boardID;
			}
			if (id) {
				setTimeout(() => {
					this.select(id);
				});
			}
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

	select(id?: string): void {
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

	removeCustomLayout(event: MouseEvent, layout: LayoutItem): void {
		event.stopPropagation();
		if (confirm(this.translate.instant('CUSTOM_BOARD_DELETE_SURE'))) {
			this.layoutService.removeCustomLayout([layout.layout.id]);
			this.refresh();
		}
	}

}
