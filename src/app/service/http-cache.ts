import type { HttpClient } from '@angular/common/http';

interface CacheItem {
	data?: string;
	request?: Promise<string>;
}

export class HttpCache {
	private readonly cache: Record<string, CacheItem> = {};

	constructor(private readonly http: HttpClient) {}

	async get(url: string): Promise<string> {
		let item = this.cache[url];
		if (item) {
			if (item.data) {
				return item.data;
			}
			if (item.request !== undefined) {
				return item.request;
			}
		}
		item = {};
		this.cache[url] = item;

		const request = new Promise<string>((resolve, reject) => {
			this.http.get(url, { responseType: 'text' })
				.subscribe({
					next: result => {
						item.data = result;
						item.request = undefined;
						resolve(result);
					},
					error: (error: unknown) => {
						delete this.cache[url];
						reject(error as Error);
					}
				});
		});
		item.request = request;
		return request;
	}
}
