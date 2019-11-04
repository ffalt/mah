import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {cleanImportLayout, CompactMapping, convertKyodai, expandMapping, expandMappingDeprecated} from '../model/import';
import {generateStaticLayoutSVG} from '../model/layout-svg';
import {Layout, Layouts, Mapping} from '../model/layouts';

export interface LoadLayout {
	name: string;
	cat?: string;
	mapping?: Mapping;
	map?: CompactMapping;
}

@Injectable()
export class LayoutService {
	layouts: Layouts;

	constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
	}

	async get(): Promise<Layouts> {
		if (this.layouts) {
			return this.layouts;
		}
		const result: Array<LoadLayout> = await this.http.get<Array<LoadLayout>>('assets/data/boards.json').toPromise();
		this.layouts = {
			items: result.map(o => {
				const name = o.name;
				const category = o.cat || 'Classic';
				let mapping: Mapping = [];
				if (o.map) {
					mapping = expandMapping(o.map);
				}
				if (o.mapping) {
					mapping = expandMappingDeprecated(o.mapping);
				}
				return {name, category, mapping, previewSVG: this.sanitizer.bypassSecurityTrustUrl(generateStaticLayoutSVG(mapping))};
			}).filter(layout => layout.mapping.length > 0)
		};
		return this.layouts;
	}

	async importFile(file: File): Promise<Layout> {
		const s = await LayoutService.readFile(file);
		let layout = await convertKyodai(s);
		layout = cleanImportLayout(layout);
		const previewSVG = this.sanitizer.bypassSecurityTrustUrl(generateStaticLayoutSVG(layout.mapping));
		return {...layout, category: 'Import', previewSVG};
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
