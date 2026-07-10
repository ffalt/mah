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
		const items: Array<Layout> = [];
		const loadLayouts: Array<LoadLayout> | undefined = await this.requestBoards();
		const builtInLayouts: Array<LoadLayout> = loadLayouts ?? [];
		for (const o of builtInLayouts) {
			const layout = this.expandLayout(o);
			if (layout) {
				items.push(layout);
			}
		}
		const customLayouts: Array<LoadLayout> = this.loadCustomLayouts();
		for (const o of customLayouts) {
			const layout = this.expandLayout(o, true);
			if (layout) {
				items.push(layout);
			}
		}
		this.layouts = { items };
		// only cache as loaded when the built-in boards were actually fetched; a failed request must be retried on the next get()
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

	expandLayout(o: LoadLayout, isCustom?: boolean): Layout {
		const mapping: Mapping = expandMapping(o.map || []);
		return {
			id: o.id && o.id !== '' ? o.id : mappingToID(mapping),
			name: o.name,
			by: o.by,
			category: o.cat ?? 'Classic',
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

	storeCustomBoards(list: Array<LoadLayout>) {
		const customLayouts = this.loadCustomLayouts();
		this.storage.storeCustomLayouts([...customLayouts, ...list]);
		this.layouts.items = [...this.layouts.items, ...list.map(layout => this.expandLayout(layout, true))];
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
