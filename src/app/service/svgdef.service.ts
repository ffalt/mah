import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {buildKyodaiSVG, imageSetIsKyodai} from '../modules/core/model/tilesets';

interface CacheItem {
	data?: string;
	request?: Promise<string>;
}

@Injectable()
export class SvgdefService {

	private cache: { [name: string]: CacheItem } = {};

	constructor(private http: HttpClient) {
	}

	async get(name: string, kyodaiUrl?: string): Promise<string> {
		if (imageSetIsKyodai(name)) {
			return buildKyodaiSVG(kyodaiUrl);
		}
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
				.subscribe({
					next: res => {
						item.data = res;
						item.request = undefined;
						resolve(res);
					},
					error: err => {
						reject(err);
					}
				});
		});
		item.request = request;
		this.cache[name] = item;
		return request;
	}

}
