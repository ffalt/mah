import { Component, type OnChanges, type SimpleChanges, type WritableSignal, computed, inject, input, output, signal, viewChild, type ElementRef, type OnInit } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Layout, SafeUrlSVG } from '../../model/types';
import { LocalstorageService } from '../../service/localstorage.service';
import { LayoutService } from '../../service/layout.service';
import { DeferLoadScrollHostDirective } from '../../directives/defer-load/defer-load-scroll-host.directive';
import { generateSeededRandomMapping } from '../../model/random-layout/random-layout';
import { RANDOM_LAYOUT_ID_PREFIX, type RandomSymmetry } from '../../model/random-layout/consts';
import { generateLayoutSeed } from '../../model/rng';
import { TranslateGroupPipe } from '../../pipes/translate-group.pipe';
import { LayoutListItemComponent } from '../layout-list-item/layout-list-item.component';
import { IconMirrorVerticalComponent } from '../icons/icon-mirror-vertical.component';
import { IconMirrorHorizontalComponent } from '../icons/icon-mirror-horizontal.component';

const CARD = '[app-layout-list-item]';
const GROUP_NAME = '.group-name';
const ROW_STOPS = `${GROUP_NAME}, ${CARD}`;
const CARD_ID_PREFIX = 'item-';
const GROUP_ID_PREFIX = 'group-name-';
const ROW_TOLERANCE = 4;

function stopCenter(stop: HTMLElement): number {
	const rect = stop.getBoundingClientRect();
	return rect.left + (rect.width / 2);
}

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

	readonly activeStopId = signal<string | undefined>(undefined);
	readonly stopId = computed<string | undefined>(() => {
		const stops = this.stopIds();
		const active = this.activeStopId();
		if (active && stops.includes(active)) {
			return active;
		}
		const selected = this.groups()
			.filter(group => group.expanded())
			.flatMap(group => group.layouts)
			.find(item => item.selected());
		return selected ? `${CARD_ID_PREFIX}${selected.layout.id}` : stops.at(0);
	});

	readonly tabbableId = computed<string | undefined>(() => {
		const stop = this.stopId();
		return stop?.startsWith(CARD_ID_PREFIX) ? stop.slice(CARD_ID_PREFIX.length) : undefined;
	});

	private readonly storage = inject(LocalstorageService);
	protected readonly translate = inject(TranslateService);
	private readonly layoutService = inject(LayoutService);

	ngOnInit(): void {
		this.randomMirrorX.set(this.storage.getLastMirrorX() ?? 'random');
		this.randomMirrorY.set(this.storage.getLastMirrorY() ?? 'random');
		this.buildRandomGroup();
	}

	buildRandomGroup() {
		this.randomGroup.layouts = [];
		for (let index = 0; index < 4; index++) {
			this.randomGroup.layouts.push(
				{
					layout: {
						id: `${RANDOM_LAYOUT_ID_PREFIX}${index}`,
						name: '',
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
		const mapping = generateSeededRandomMapping(
			layoutItem.layoutSeed(),
			this.randomMirrorX() as RandomSymmetry,
			this.randomMirrorY() as RandomSymmetry,
			'random'
		);
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

	groupTabIndex(index: number): number {
		return this.stopId() === `${GROUP_ID_PREFIX}${index}` ? 0 : -1;
	}

	onGalleryKeydown(event: KeyboardEvent): void {
		const current = event.target as HTMLElement | null;
		const stop = current?.closest<HTMLElement>(ROW_STOPS);
		if (!stop) {
			return;
		}
		const target = this.galleryTarget(event, current as HTMLElement, stop);
		if (!target) {
			return;
		}
		event.preventDefault();
		this.activeStopId.set(target.closest<HTMLElement>(ROW_STOPS)?.id);
		target.focus();
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
			const stop = element.querySelector<HTMLElement>(ROW_STOPS);
			this.activeStopId.set(stop?.id);
			stop?.focus();
		}
	}

	scrollToItem(id: string): void {
		const element = document.getElementById(`${CARD_ID_PREFIX}${id}`);
		if (element) {
			this.scrollToElement(element, this.scrollHost().nativeElement);
			this.activeStopId.set(`${CARD_ID_PREFIX}${id}`);
			element.focus();
		}
	}

	private galleryTarget(event: KeyboardEvent, current: HTMLElement, stop: HTMLElement): HTMLElement | undefined {
		switch (event.key) {
			case 'ArrowRight':
			case 'ArrowLeft': {
				const stops = this.galleryElements(`${ROW_STOPS}, ${CARD} button, ${CARD} input`);
				return stops[stops.indexOf(current) + (event.key === 'ArrowRight' ? 1 : -1)];
			}
			case 'ArrowDown': {
				return this.stopInRow(stop, 1);
			}
			case 'ArrowUp': {
				return this.stopInRow(stop, -1);
			}
			case 'Home': {
				return this.galleryElements(ROW_STOPS).at(0);
			}
			case 'End': {
				return this.galleryElements(ROW_STOPS).at(-1);
			}
			case 'PageDown': {
				return this.groupHeader(stop, 1);
			}
			case 'PageUp': {
				return this.groupHeader(stop, -1);
			}
			default: {
				return undefined;
			}
		}
	}

	private galleryElements(selector: string): Array<HTMLElement> {
		return Array.from(this.scrollHost().nativeElement.querySelectorAll<HTMLElement>(selector));
	}

	// the cards wrap, so the row a stop sits in is only known from its position
	private stopInRow(stop: HTMLElement, direction: number): HTMLElement | undefined {
		const rows: Array<Array<HTMLElement>> = [];
		let rowTop: number | undefined;
		for (const entry of this.galleryElements(ROW_STOPS)) {
			const top = entry.getBoundingClientRect().top;
			if (rowTop === undefined || Math.abs(top - rowTop) > ROW_TOLERANCE) {
				rows.push([]);
				rowTop = top;
			}
			rows.at(-1)?.push(entry);
		}
		const row = rows[rows.findIndex(entry => entry.includes(stop)) + direction];
		if (!row) {
			return undefined;
		}
		// a header spans the whole row, so its centre says nothing about where to land
		if (stop.matches(GROUP_NAME)) {
			return row.at(direction > 0 ? 0 : -1);
		}
		const center = stopCenter(stop);
		let closest = row[0];
		for (const entry of row) {
			if (Math.abs(stopCenter(entry) - center) < Math.abs(stopCenter(closest) - center)) {
				closest = entry;
			}
		}
		return closest;
	}

	private groupHeader(stop: HTMLElement, direction: number): HTMLElement | undefined {
		const headers = this.galleryElements(GROUP_NAME);
		const own = stop.closest('.group')?.querySelector<HTMLElement>(GROUP_NAME);
		return own ? headers[headers.indexOf(own) + direction] : undefined;
	}

	private stopIds(): Array<string> {
		const groups = this.groups();
		const ids: Array<string> = [];
		for (const [index, group] of groups.entries()) {
			if (groups.length > 1) {
				ids.push(`${GROUP_ID_PREFIX}${index}`);
			}
			if (group.expanded()) {
				ids.push(...group.layouts.map(item => `${CARD_ID_PREFIX}${item.layout.id}`));
			}
		}
		return ids;
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
	}
}
