import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {firstValueFrom, Observable} from 'rxjs';
import {cleanImportLayout, convertKyodai, expandMapping, expandMappingDeprecated, mappingToID} from '../model/import';
import {generateStaticLayoutSVG} from '../model/layout-svg';
import {Layout, Layouts, LoadLayout, Mapping} from '../model/types';

@Injectable()
export class LayoutService {
	layouts: Layouts;

	constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
	}

	getBoards(): Observable<Array<LoadLayout>> {
		return this.http.get<Array<LoadLayout>>('assets/data/boards.json');
	}

	async get(): Promise<Layouts> {
		if (this.layouts) {
			return this.layouts;
		}
		const result: Array<LoadLayout> = await firstValueFrom(this.getBoards());

		const items: Array<Layout> = [];
		for (const o of result) {
			const name = o.name;
			const category = o.cat || 'Classic';
			let mapping: Mapping = [];
			if (o.map) {
				mapping = expandMapping(o.map);
			}
			if (o.mapping) {
				mapping = expandMappingDeprecated(o.mapping);
			}
			if (mapping.length > 0) {
				const layout = {id: o.id ? o.id : mappingToID(mapping), name, category, mapping, previewSVG: this.sanitizer.bypassSecurityTrustUrl(generateStaticLayoutSVG(mapping))};
				items.push(layout);
			}
		}
		this.layouts = {items};
		return this.layouts;
	}

	async importFile(file: File): Promise<Layout> {
		const s = await LayoutService.readFile(file);
		let layout = await convertKyodai(s);
		layout = cleanImportLayout(layout);
		const previewSVG = this.sanitizer.bypassSecurityTrustUrl(generateStaticLayoutSVG(layout.mapping));
		return {id: mappingToID(layout.mapping), name: layout.name, mapping: layout.mapping, category: layout.cat || 'Import', previewSVG};
	}

	private static async readFile(file: File): Promise<string> {
		const reader = new FileReader();
		return new Promise<string>((resolve, reject) => {
			reader.onload = () => {
				resolve(reader.result as string);
			};
			reader.onerror = () => {
				reject(Error(`Reading File failed: ${reader.error}`));
			};
			reader.readAsBinaryString(file);
		});
	}

}
