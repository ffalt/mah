import { Component, type OnChanges, type SimpleChanges, inject, input, output } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Layout } from '../../model/types';
import { LocalstorageService } from '../../service/localstorage.service';
import { LayoutService } from '../../service/layout.service';
import { LayoutPreviewComponent } from '../layout-preview/layout-preview.component';
import { DurationPipe } from '../../pipes/duration.pipe';
import { DeferLoadScrollHostDirective } from '../../directives/defer-load/defer-load-scroll-host.directive';
import { DeferLoadDirective } from '../../directives/defer-load/defer-load.directive';

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
	imports: [LayoutPreviewComponent, DurationPipe, TranslatePipe, DeferLoadScrollHostDirective, DeferLoadDirective]
})
export class LayoutListComponent implements OnChanges {
	readonly layouts = input<Array<Layout>>();
	readonly startEvent = output<Layout>();
	groups: Array<LayoutGroup> = [];
	private readonly storage = inject(LocalstorageService);
	private readonly translate = inject(TranslateService);
	private readonly layoutService = inject(LayoutService);

	constructor() {
		if (this.layouts()) {
			this.buildGroups();
		}
	}

	ngOnChanges(_changes: SimpleChanges): void {
		this.refresh();
	}

	refresh(): void {
		const layouts = this.layouts();
		if (layouts) {
			this.buildGroups();
			let id = this.storage.getLastPlayed();
			const boardID = this.layoutService.selectBoardID;
			this.layoutService.selectBoardID = undefined;
			if (boardID && layouts.some(l => l.id === boardID)) {
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
				g[layout.category] = { name: layout.category, layouts: [], visible: false };
				groups.push(g[layout.category]);
			}
			const score = this.storage.getScore(layout.id) || {};
			g[layout.category].layouts.push({ layout, playCount: score.playCount, bestTime: score.bestTime, visible: false });
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
			for (const g of this.groups) {
				for (const layout of g.layouts) {
					layout.selected = layout.layout.id === id;
				}
			}
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
