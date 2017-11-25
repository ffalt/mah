import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class SvgdefService {

	private cache = {};

	constructor(private http: HttpClient) {
	}

	public get(name: string, callback: (def: string) => void) {
		this.cache[name] = this.cache[name] || {data: false, listeners: []};
		const request = this.cache[name];
		if (request.data) {
			return callback(request.data);
		} else {
			request.listeners.push(callback);
		}
		if (request.listeners.length === 1) {
			this.http.get('assets/svg/' + name + '.svg', {responseType: 'text'})
				.subscribe(res => {
					request.data = res;
					request.listeners.forEach(listen => {
						listen(res);
					});
					request.listeners = undefined;
				});
		}
	}

}
