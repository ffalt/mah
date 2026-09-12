import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { expandMapping, mappingToID } from '../model/mapping';
import { generateBase64SVG } from '../model/layout-svg';
import type { CompactMapping, Layout, Layouts, LoadLayout, Mapping, SafeUrlSVG } from '../model/types';
import { LocalstorageService } from './localstorage.service';
import { log } from '../model/log';

@Service()
export class LayoutService {
	static layout2loadLayout(layout: Layout, map: CompactMapping): LoadLayout {
		return {
			id: layout.id,
			name: layout.name,
			by: layout.by,
			cat: layout.category,
			map
		};
	}

	private readonly http = inject(HttpClient);
	private readonly sanitizer = inject(DomSanitizer);
	private readonly storage = inject(LocalstorageService);

	layouts: Layouts = { items: [] };
	loaded = false;
	selectBoardID?: string | null;

	async get(): Promise<Layouts> {
		if (this.loaded) {
			return this.layouts;
		}
		const loadLayouts: Array<LoadLayout> | undefined = await this.requestBoards();
		this.layouts = {
			items: [
				...this.expandLayouts(loadLayouts ?? []),
				...this.expandLayouts(this.loadCustomLayouts(), true)
			]
		};
		this.loaded = loadLayouts !== undefined;
		return this.layouts;
	}

	removeAllCustomLayouts(): void {
		this.layouts.items = this.layouts.items.filter(l => !l.custom);
		this.storage.storeCustomLayouts();
	}

	removeCustomLayout(ids: Array<string>): void {
		this.layouts.items = this.layouts.items.filter(l => !l.custom || !ids.includes(l.id));
		const customLayouts = (this.storage.getCustomLayouts() || []).filter(l => !ids.includes(l.id));
		this.storage.storeCustomLayouts(customLayouts.length === 0 ? undefined : customLayouts);
	}

	expandLayouts(list: Array<LoadLayout>, isCustom?: boolean): Array<Layout> {
		const items: Array<Layout> = [];
		for (const o of list) {
			try {
				items.push(this.expandLayout(o, isCustom));
			} catch (error) {
				log.warn('Failed to expand layout, skipping:', o?.id ?? o?.name, error);
			}
		}
		return items;
	}

	expandLayout(o: LoadLayout, isCustom?: boolean): Layout {
		const mapping: Mapping = expandMapping(o.map || []);
		return {
			id: o.id && o.id !== '' ? o.id : mappingToID(mapping),
			name: o.name,
			by: o.by,
			category: o.cat?.trim() || 'Classic',
			mapping,
			custom: isCustom
		};
	}

	getPreview(layout: Layout): SafeUrlSVG {
		layout.previewSVG ??= this.generatePreview(layout.mapping);
		return layout.previewSVG;
	}

	loadCustomLayouts(): Array<LoadLayout> {
		return this.storage.getCustomLayouts() || [];
	}

	storeCustomBoards(list: Array<LoadLayout>): number {
		const customLayouts = this.loadCustomLayouts();
		const known = new Set(this.expandLayouts(customLayouts, true).map(layout => layout.id));
		const added: Array<LoadLayout> = [];
		const expanded: Array<Layout> = [];
		for (const layout of list) {
			const expandedLayout = this.expandLayout(layout, true);
			if (!known.has(expandedLayout.id)) {
				known.add(expandedLayout.id);
				added.push(layout);
				expanded.push(expandedLayout);
			}
		}
		if (added.length === 0) {
			return 0;
		}
		this.storage.storeCustomLayouts([...customLayouts, ...added]);
		this.layouts.items = [...this.layouts.items, ...expanded];
		return added.length;
	}

	generatePreview(mapping: Mapping): SafeUrlSVG {
		return this.sanitizer.bypassSecurityTrustUrl(generateBase64SVG(mapping)) as SafeUrlSVG;
	}

	private async requestBoards(): Promise<Array<LoadLayout> | undefined> {
		try {
			return await firstValueFrom(this.http.get<Array<LoadLayout>>('assets/data/boards.json'));
		} catch (error) {
			log.error('Failed to load boards.json:', error);
			return undefined;
		}
	}
}
