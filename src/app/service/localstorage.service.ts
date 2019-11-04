import {Injectable} from '@angular/core';
import {StorageProvider} from '../model/types';

@Injectable({
	providedIn: 'root'
})
export class LocalstorageService implements StorageProvider {
	private readonly prefix = '';

	get<T>(key: string): T | undefined {
		if (!localStorage) {
			return;
		}
		try {
			return JSON.parse(localStorage.getItem(`${this.prefix}${key}`));
		} catch (e) {
			return undefined;
		}
	}

	set<T>(key: string, data: T): void {
		if (!localStorage) {
			return;
		}
		if (data === undefined) {
			localStorage.removeItem(`${this.prefix}${key}`);
		} else {
			localStorage.setItem(this.prefix + key, JSON.stringify(data));
		}
	}

}
