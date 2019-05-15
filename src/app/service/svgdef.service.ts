import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

interface CacheItem {
	data?: string;
	request?: Promise<string>;
}

@Injectable()
export class SvgdefService {

	private cache: { [name: string]: CacheItem } = {};

	constructor(private http: HttpClient) {
	}

	async get(name: string): Promise<string> {
		let item = this.cache[name];
		if (item) {
			if (item.data) {
				return item.data;
			}
			if (item.request) {
				return item.request;
			}
		}
		item = {};
		const request = new Promise<string>((resolve, reject) => {
			this.http.get(`assets/svg/${name}.svg`, {responseType: 'text'})
				.subscribe(res => {
					item.data = res;
					item.request = undefined;
					resolve(res);
				}, err => {
					reject(err);
				});
		});
		item.request = request;
		this.cache[name] = item;
		return request;
	}

}
