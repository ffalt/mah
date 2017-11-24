import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class SvgdefService {

	constructor(private http: HttpClient) {
	}

	public get(name: string, callback: (def: string) => void) {
		this.http.get('assets/svg/' + name + '.svg', {responseType: 'text'})
			.subscribe(res => {
				callback(res);
			});
	}

}
