import { Component, type OnChanges, type SimpleChanges, inject, input, output, viewChild, type ElementRef, type OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Layout } from '../../model/types';
import { LocalstorageService } from '../../service/localstorage.service';
import { LayoutService } from '../../service/layout.service';
import { LayoutPreviewComponent } from '../layout-preview/layout-preview.component';
import { DurationPipe } from '../../pipes/duration.pipe';
import { DeferLoadScrollHostDirective } from '../../directives/defer-load/defer-load-scroll-host.directive';
import { DeferLoadDirective } from '../../directives/defer-load/defer-load.directive';
import { generateRandomMapping } from '../../model/random-layout/random-layout';
import { RANDOM_LAYOUT_ID_PREFIX, type RandomSymmetry } from '../../model/random-layout/consts';

export interface LayoutItem {
	layout: Layout;
	visible: boolean;
	playCount?: number;
	bestTime?: number;
	selected?: boolean;
}

export interface LayoutGroup {
	name: string;
	expanded: boolean;
	isRandom?: boolean;
	layouts: Array<LayoutItem>;
}

@Component({
	selector: 'app-layout-list',
	templateUrl: './layout-list.component.html',
	styleUrls: ['./layout-list.component.scss'],
	imports: [LayoutPreviewComponent, DurationPipe, TranslatePipe, DeferLoadScrollHostDirective, DeferLoadDirective]
})
export class LayoutListComponent implements OnInit, OnChanges {
	readonly layouts = input<Array<Layout>>();
	readonly startEvent = output<Layout>();
	readonly scrollHost = viewChild.required<ElementRef<HTMLElement>>('scrollHost');
	groups: Array<LayoutGroup> = [];
	randomMirrorX: string = 'random';
	randomMirrorY: string = 'random';
	randomGroup: LayoutGroup = {
		name: '',
		layouts: [], expanded: true, isRandom: true
	};

	private readonly storage = inject(LocalstorageService);
	private readonly translate = inject(TranslateService);
	private readonly layoutService = inject(LayoutService);

	ngOnInit(): void {
		this.randomMirrorX = this.storage.getLastMirrorX() ?? 'random';
		this.randomMirrorY = this.storage.getLastMirrorY() ?? 'random';
		this.buildRandomGroup();
	}

	buildRandomGroup() {
		this.randomGroup.name = this.translate.instant('RANDOM_GROUP');
		const layoutName = this.translate.instant('RANDOM_LAYOUT');
		for (let index = 0; index < 4; index++) {
			this.randomGroup.layouts.push(
				{
					layout: {
						id: `${RANDOM_LAYOUT_ID_PREFIX}${index}`,
						name: `${layoutName} ${index + 1}`,
						category: this.randomGroup.name,
						mapping: []
					},
					visible: false, selected: false
				}
			);
		}
		this.generateRandomLayouts();
	}

	randomMirrorXSet(value: string): void {
		this.randomMirrorX = value;
		this.storage.setLastMirrorX(value);
		this.generateRandomLayouts();
	}

	randomMirrorYSet(value: string): void {
		this.randomMirrorY = value;
		this.storage.setLastMirrorY(value);
		this.generateRandomLayouts();
	}

	generateRandomLayout(layoutItem: LayoutItem): void {
		const mapping = generateRandomMapping(
			this.randomMirrorX as RandomSymmetry,
			this.randomMirrorY as RandomSymmetry,
			'random'
		);
		layoutItem.layout.previewSVG = this.layoutService.generatePreview(mapping);
		layoutItem.layout.mapping = mapping;
	}

	generateRandomLayouts(): void {
		for (const item of this.randomGroup.layouts) {
			setTimeout(() => {
				this.generateRandomLayout(item);
			});
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

	onStart(layoutItem: LayoutItem): void {
		if (layoutItem?.visible) {
			this.startEvent.emit(layoutItem.layout);
		}
	}

	buildGroups(): void {
		const groups: Array<LayoutGroup> = [];
		const g: { [name: string]: LayoutGroup } = {};
		const source = this.layouts() ?? this.layoutService.layouts.items;
		for (const layout of source) {
			if (!g[layout.category]) {
				g[layout.category] = { name: layout.category, layouts: [], expanded: true };
				groups.push(g[layout.category]);
			}
			const score = this.storage.getScore(layout.id) || {};
			g[layout.category].layouts.push({ layout, playCount: score.playCount, bestTime: score.bestTime, visible: false });
		}
		groups.push(this.randomGroup);
		this.groups = groups;
	}

	scrollToElement(element: HTMLElement, container: HTMLElement): void {
		if (!element || !container) {
			return;
		}

		const elementRect = element.getBoundingClientRect();
		const containerRect = container.getBoundingClientRect();
		const targetTop = elementRect.top - containerRect.top + container.scrollTop;

		container.scrollTo({
			top: targetTop,
			behavior: 'auto'
		});
	}

	scrollToGroup(index: number): void {
		const element = document.getElementById(`group-${index}`);
		if (element) {
			this.scrollToElement(element, this.scrollHost().nativeElement);
		}
	}

	scrollToItem(id: string): void {
		const element = document.getElementById(`item-${id}`);
		if (element) {
			this.scrollToElement(element, this.scrollHost().nativeElement);
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
