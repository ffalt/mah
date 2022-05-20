import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {firstValueFrom} from 'rxjs';
import {expandMapping, mappingToID} from '../model/mapping';
import {generateStaticLayoutSVG} from '../model/layout-svg';
import {Layout, Layouts, LoadLayout, Mapping} from '../model/types';
import {LocalstorageService} from './localstorage.service';

@Injectable()
export class LayoutService {
	layouts: Layouts;

	constructor(private http: HttpClient, private sanitizer: DomSanitizer, private storage: LocalstorageService) {
	}

	async get(): Promise<Layouts> {
		if (this.layouts) {
			return this.layouts;
		}
		const items: Array<Layout> = [];
		const loadLayouts: Array<LoadLayout> = await this.requestBoards();
		for (const o of loadLayouts) {
			const layout = this.expandLayout(o);
			if (layout) {
				items.push(layout);
			}
		}
		const customLayouts: Array<LoadLayout> = this.loadCustomBoards();
		for (const o of customLayouts) {
			const layout = this.expandLayout(o, true);
			if (layout) {
				items.push(layout);
			}
		}
		this.layouts = {items};
		return this.layouts;
	}

	removeAllCustomLayouts(): void {
		this.layouts.items = this.layouts.items.filter(l => !l.custom);
		this.storage.storeCustomLayouts(undefined);
	}

	removeCustomLayout(ids: Array<string>): void {
		this.layouts.items = this.layouts.items.filter(l => !l.custom || !ids.includes(l.id));
		const customLayouts = (this.storage.getCustomLayouts() || []).filter(l => !ids.includes(l.id));
		this.storage.storeCustomLayouts(customLayouts.length === 0 ? undefined : customLayouts);
	}

	expandLayout(o: LoadLayout, custom?: boolean): Layout {
		const mapping: Mapping = expandMapping(o.map || []);
		return {
			id: o.id && o.id !== '' ? o.id : mappingToID(mapping),
			name: o.name,
			by: o.by,
			category: o.cat || 'Classic',
			mapping: expandMapping(o.map),
			previewSVG: this.generatePreview(mapping),
			custom
		};
	}

	loadCustomBoards(): Array<LoadLayout> {
		return this.storage.getCustomLayouts() || [];
	}

	storeCustomBoards(list: Array<LoadLayout>) {
		const customLayouts = this.loadCustomBoards();
		this.storage.storeCustomLayouts(customLayouts.concat(list));
		this.layouts.items = this.layouts.items.concat(list.map(layout => this.expandLayout(layout, true)));
	}

	generatePreview(mapping: Mapping): SafeUrl {
		return this.sanitizer.bypassSecurityTrustUrl(generateStaticLayoutSVG(mapping));
	}

	private async requestBoards(): Promise<Array<LoadLayout>> {
		return firstValueFrom(this.http.get<Array<LoadLayout>>('assets/data/boards.json'));
	}

}
