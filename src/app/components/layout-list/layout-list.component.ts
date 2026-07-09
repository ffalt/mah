import { Component, type OnChanges, type SimpleChanges, type WritableSignal, inject, input, output, signal, viewChild, type ElementRef, type OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Layout, SafeUrlSVG } from '../../model/types';
import { LocalstorageService } from '../../service/localstorage.service';
import { LayoutService } from '../../service/layout.service';
import { DeferLoadScrollHostDirective } from '../../directives/defer-load/defer-load-scroll-host.directive';
import { generateRandomMapping } from '../../model/random-layout/random-layout';
import { RANDOM_LAYOUT_ID_PREFIX, type RandomSymmetry } from '../../model/random-layout/consts';
import { seedRNG, resetRNG, generateLayoutSeed } from '../../model/rng';
import { TranslateGroupPipe } from '../../pipes/translate-group.pipe';
import { LayoutListItemComponent } from '../layout-list-item/layout-list-item.component';
import { IconMirrorVerticalComponent } from '../icons/icon-mirror-vertical.component';
import { IconMirrorHorizontalComponent } from '../icons/icon-mirror-horizontal.component';

export interface LayoutItem {
	layout: Layout;
	readonly visible: WritableSignal<boolean>;
	readonly selected: WritableSignal<boolean>;
	playCount?: number;
	bestTime?: number;
}

export interface LayoutGroup {
	name: string;
	readonly expanded: WritableSignal<boolean>;
	isRandom?: boolean;
	layouts: Array<LayoutItem>;
}

export interface RandomLayoutItem extends LayoutItem {
	readonly layoutSeed: WritableSignal<string>;
	readonly previewSVG: WritableSignal<SafeUrlSVG | undefined>;
}

export interface RandomLayoutGroup extends LayoutGroup {
	isRandom: true;
	layouts: Array<RandomLayoutItem>;
}

@Component({
	selector: 'app-layout-list',
	templateUrl: './layout-list.component.html',
	styleUrls: ['./layout-list.component.scss'],
	imports: [
		TranslatePipe, TranslateGroupPipe,
		DeferLoadScrollHostDirective, LayoutListItemComponent,
		IconMirrorVerticalComponent, IconMirrorHorizontalComponent
	]
})
export class LayoutListComponent implements OnInit, OnChanges {
	readonly layouts = input<Array<Layout>>();
	readonly startEvent = output<Layout>();
	readonly scrollHost = viewChild.required<ElementRef<HTMLElement>>('scrollHost');
	readonly groups = signal<Array<LayoutGroup>>([]);
	readonly randomMirrorX = signal('random');
	readonly randomMirrorY = signal('random');
	readonly randomGroup: RandomLayoutGroup = {
		name: '',
		layouts: [], expanded: signal(true), isRandom: true
	};

	private readonly storage = inject(LocalstorageService);
	private readonly translate = inject(TranslateService);
	private readonly layoutService = inject(LayoutService);

	ngOnInit(): void {
		this.randomMirrorX.set(this.storage.getLastMirrorX() ?? 'random');
		this.randomMirrorY.set(this.storage.getLastMirrorY() ?? 'random');
		this.buildRandomGroup();
	}

	buildRandomGroup() {
		this.randomGroup.name = this.translate.instant('RANDOM_GROUP');
		const layoutName = this.translate.instant('RANDOM_LAYOUT');
		this.randomGroup.layouts = [];
		for (let index = 0; index < 4; index++) {
			this.randomGroup.layouts.push(
				{
					layout: {
						id: `${RANDOM_LAYOUT_ID_PREFIX}${index}`,
						name: `${layoutName} ${index + 1}`,
						category: this.randomGroup.name,
						mapping: []
					},
					visible: signal(false),
					selected: signal(false),
					layoutSeed: signal(''),
					previewSVG: signal<SafeUrlSVG | undefined>(undefined)
				}
			);
		}
		this.generateRandomLayouts();
	}

	randomMirrorXSet(value: string): void {
		this.randomMirrorX.set(value);
		this.storage.setLastMirrorX(value);
		this.generateRandomLayouts();
	}

	randomMirrorYSet(value: string): void {
		this.randomMirrorY.set(value);
		this.storage.setLastMirrorY(value);
		this.generateRandomLayouts();
	}

	generateRandomLayout(layoutItem: RandomLayoutItem, layoutSeed?: string): void {
		layoutItem.layoutSeed.set(layoutSeed ?? generateLayoutSeed());
		seedRNG(layoutItem.layoutSeed());
		const mapping = generateRandomMapping(
			this.randomMirrorX() as RandomSymmetry,
			this.randomMirrorY() as RandomSymmetry,
			'random'
		);
		resetRNG();
		layoutItem.previewSVG.set(this.layoutService.generatePreview(mapping));
		layoutItem.layout.mapping = mapping;
	}

	generateRandomLayouts(): void {
		// deferred off the dialog-open path; one batch so all previews land in a single change detection round
		setTimeout(() => {
			for (const item of this.randomGroup.layouts) {
				this.generateRandomLayout(item);
			}
		}, 0);
	}

	regenerateWithSeed(item: RandomLayoutItem, seed: string): void {
		const trimmed = seed.trim();
		if (trimmed) {
			this.generateRandomLayout(item, trimmed);
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
				// deferred so the list DOM exists when scrolling to the selection
				setTimeout(() => {
					this.select(id);
				}, 0);
			}
		}
	}

	onStart(layoutItem: LayoutItem): void {
		if (layoutItem?.layout) {
			this.startEvent.emit(layoutItem.layout);
		}
	}

	buildGroups(): void {
		// carry the card and group state over so reveal, selection and collapse survive rebuilds
		const previousItems = new Map<string, LayoutItem>();
		const previousGroups = new Map<string, LayoutGroup>();
		for (const group of this.groups()) {
			previousGroups.set(group.name, group);
			for (const item of group.layouts) {
				previousItems.set(item.layout.id, item);
			}
		}
		const groups: Array<LayoutGroup> = [];
		const g: { [name: string]: LayoutGroup } = {};
		const source = this.layouts() ?? this.layoutService.layouts.items;
		const scores = this.storage.getScores();
		for (const layout of source) {
			if (!g[layout.category]) {
				g[layout.category] = { name: layout.category, layouts: [], expanded: previousGroups.get(layout.category)?.expanded ?? signal(true) };
				groups.push(g[layout.category]);
			}
			const score = scores.get(layout.id) || {};
			const previousItem = previousItems.get(layout.id);
			g[layout.category].layouts.push({
				layout,
				playCount: (score.winCount ?? 0) + (score.loseCount ?? 0),
				bestTime: score.bestTime,
				visible: previousItem?.visible ?? signal(false),
				selected: previousItem?.selected ?? signal(false)
			});
		}
		groups.push(this.randomGroup);
		this.groups.set(groups);
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

	scrollToGroup(event: Event, index: number): void {
		event.preventDefault();
		const element = document.getElementById(`group-${index}`);
		if (element) {
			this.scrollToElement(element, this.scrollHost().nativeElement);
			element.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
		}
	}

	scrollToItem(id: string): void {
		const element = document.getElementById(`item-${id}`);
		if (element) {
			this.scrollToElement(element, this.scrollHost().nativeElement);
			element.focus();
		}
	}

	select(id?: string): void {
		if (!id) {
			return;
		}

		for (const g of this.groups()) {
			for (const layout of g.layouts) {
				layout.selected.set(layout.layout.id === id);
			}
		}
		this.scrollToItem(id);
	}

	toggleGroupExpanded(event: Event, group: LayoutGroup): void {
		event.preventDefault();
		group.expanded.update(expanded => !expanded);
	}

	clearBestTime(layout: LayoutItem): void {
		if (!confirm(this.translate.instant('BEST_TIME_CLEAR_SURE'))) {
			return;
		}
		this.storage.clearScore(layout.layout.id);
		layout.bestTime = undefined;
		layout.playCount = undefined;
	}

	removeCustom(layout: LayoutItem): void {
		if (!confirm(this.translate.instant('CUSTOM_BOARD_DELETE_SURE'))) {
			return;
		}
		this.layoutService.removeCustomLayout([layout.layout.id]);
		this.refresh();
	}
}
