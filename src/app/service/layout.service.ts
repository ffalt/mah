import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Layouts, Mapping} from '../model/layouts';

@Injectable()
export class LayoutService {
	layouts: Layouts;

	constructor(private http: HttpClient) {
	}

	async get(): Promise<Layouts> {
		if (this.layouts) {
			return this.layouts;
		}
		const result: Array<{ name: string; mapping: Mapping }> = await this.http.get<Array<{ name: string; mapping: Mapping }>>('assets/data/boards.json').toPromise();
		const layouts = new Layouts();
		layouts.load(result);
		this.layouts = layouts;
		return this.layouts;
	}
}
