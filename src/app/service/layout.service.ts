import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {cleanImportLayout, convertKyodai} from '../model/import';
import {generateStaticLayoutSVG} from '../model/layout-svg';
import {Layout, Layouts, Mapping} from '../model/layouts';

export interface LoadLayout {
	name: string;
	cat?: string;
	mapping: Mapping;
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
		const layouts = new Layouts();
		layouts.load(result);
		layouts.items.forEach(layout => {
			layout.previewSVG = this.sanitizer.bypassSecurityTrustUrl(generateStaticLayoutSVG(layout.mapping));
		});
		this.layouts = layouts;
		return this.layouts;
	}

	async importFile(file: File): Promise<Layout> {
		const s = await this.readFile(file);
		let layout = await convertKyodai(s);
		layout = await cleanImportLayout(layout);
		const previewSVG = this.sanitizer.bypassSecurityTrustUrl(generateStaticLayoutSVG(layout.mapping));
		return {...layout, category: 'Import', previewSVG};
	}

	private async readFile(file: File): Promise<string> {
		const reader = new FileReader();
		return new Promise<string>((resolve, reject) => {
			reader.onload = () => {
				resolve(reader.result as string);
			};
			reader.onerror = e => {
				reject(e);
			};
			reader.readAsBinaryString(file);
		});
	}

}
