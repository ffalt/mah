import {Injectable} from '@angular/core';
import {Layouts, Mapping} from '../model/layouts';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class LayoutService {
	public layouts: Layouts;

	constructor(private http: HttpClient) {
	}

	public get(callback: (layouts: Layouts) => void) {
		if (this.layouts) {
			return callback(this.layouts);
		}
		this.http.get<Array<{ name: string; mapping: Mapping }>>('assets/data/boards.json')
			.subscribe(res => {
				const layouts = new Layouts();
				layouts.load(res);
				this.layouts = layouts;
				callback(layouts);
			});
	}
}
