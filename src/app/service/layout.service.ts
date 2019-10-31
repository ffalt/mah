import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {generateStaticLayoutSVG} from '../model/layout-svg';
import {Layouts, Mapping} from '../model/layouts';

@Injectable()
export class LayoutService {
	layouts: Layouts;

	constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
	}

	async get(): Promise<Layouts> {
		if (this.layouts) {
			return this.layouts;
		}
		const result: Array<{ name: string; mapping: Mapping }> = await this.http.get<Array<{ name: string; mapping: Mapping }>>('assets/data/boards.json').toPromise();
		const layouts = new Layouts();
		layouts.load(result);
		layouts.items.forEach(layout => {
			layout.previewSVG = this.sanitizer.bypassSecurityTrustHtml(generateStaticLayoutSVG(layout.mapping));
		});
		this.layouts = layouts;
		return this.layouts;
	}
}
