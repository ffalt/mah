import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Builder} from '../../model/builder';
import {Layout, Layouts} from '../../model/types';
import {LayoutService} from '../../service/layout.service';
import {LocalstorageService} from '../../service/localstorage.service';

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
	selector: 'app-choose-layout',
	templateUrl: './choose-layout.component.html',
	styleUrls: ['./choose-layout.component.scss']
})
export class ChooseLayoutComponent implements OnChanges {
	@Input() layouts: Layouts;
	@Output() readonly startEvent = new EventEmitter<{ layout: Layout, mode: string }>();
	groups: Array<LayoutGroup> = [];
	mode: string = 'MODE_SOLVABLE';
	builder: Builder = new Builder();

	constructor(private layoutService: LayoutService, private storage: LocalstorageService, private translate: TranslateService) {
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (this.layouts) {
			this.buildGroups();
		}
		setTimeout(() => {
			this.selectLastPlayed();
		});
	}

	onStart(layout: Layout): void {
		if (layout) {
			this.startEvent.emit({layout, mode: this.mode});
			this.storage.storeLastPlayed(layout.id);
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

	buildGroups(): void {
		const groups: Array<LayoutGroup> = [];
		const g: { [name: string]: LayoutGroup } = {};
		for (const layout of this.layouts.items) {
			if (!g[layout.category]) {
				g[layout.category] = {name: layout.category, layouts: [], visible: false};
				groups.push(g[layout.category]);
			}
			const score = this.storage.getScore(layout.id) || {};
			g[layout.category].layouts.push({layout, playCount: score.playCount, bestTime: score.bestTime, visible: false});
		}
		this.groups = groups;
	}

	randomGame(): void {
		const index = Math.floor(Math.random() * this.layouts.items.length);
		this.onStart(this.layouts.items[index]);
	}

	onDrop(files: Array<File>): void {
		this.layoutService.importFile(files[0])
			.then(layout => {
				this.layouts.items.push(layout);
				this.buildGroups();
			})
			.catch(e => {
				alert(e);
			});
	}

	scrollToGroup(index: number): void {
		const elements = document.getElementById(`group-${index}`);
		elements.scrollIntoView();
	}

	scrollToItem(id: string): void {
		const elements = document.getElementById(`item-${id}`);
		elements.scrollIntoView();
	}

	clearBestTimeClick(event: MouseEvent, layout: LayoutItem): void {
		event.stopPropagation();
		if (confirm(this.translate.instant('BEST_TIMES_CLEAR_SURE'))) {
			this.storage.clearScore(layout.layout.id);
			layout.bestTime = undefined;
			layout.playCount = undefined;
		}
	}
}
