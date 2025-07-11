import { HttpClient } from '@angular/common/http';
import { buildKyodaiSVG, imageSetIsKyodai } from '../modules/core/model/tilesets';
import { Injectable, inject } from '@angular/core';

interface CacheItem {
	data?: string;
	request?: Promise<string>;
}

@Injectable()
export class SvgdefService {
	private readonly http = inject(HttpClient);
	private readonly cache: Record<string, CacheItem> = {};

	async get(name: string, kyodaiUrl?: string): Promise<string> {
		if (imageSetIsKyodai(name)) {
			return buildKyodaiSVG(kyodaiUrl);
		}
		let item = this.cache[name];
		if (item) {
			if (item.data) {
				return item.data;
			}
			if (item.request !== undefined) {
				return item.request;
			}
		}
		item = {};
		const request = new Promise<string>((resolve, reject) => {
			this.http.get(`assets/svg/${name}.svg`, { responseType: 'text' })
				.subscribe({
					next: res => {
						item.data = res;
						item.request = undefined;
						resolve(res);
					},
					error: err => {
						reject(err as Error);
					}
				});
		});
		item.request = request;
		this.cache[name] = item;
		return request;
	}
}
