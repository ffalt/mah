import {Injectable} from '@angular/core';
import {GameStateStore, LayoutScoreStore, SettingsStore, StorageProvider} from '../model/types';

@Injectable({
	providedIn: 'root'
})
export class LocalstorageService implements StorageProvider {

	private readonly prefix = 'mah.';

	constructor() {
		this.updateData();
	}

	getScore(id: string): LayoutScoreStore | undefined {
		return this.get<LayoutScoreStore>(`score.${id}`);
	}

	getSettings(): SettingsStore | undefined {
		return this.get<SettingsStore>('settings');
	}

	getState(): GameStateStore | undefined {
		return this.get<GameStateStore>('state');
	}

	storeScore(id: string, store?: LayoutScoreStore): void {
		this.set<LayoutScoreStore>(`score.${id}`, store);
	}

	storeSettings(store?: SettingsStore): void {
		this.set<SettingsStore>('settings', store);
	}

	storeState(store?: GameStateStore): void {
		this.set<GameStateStore>('state', store);
	}

	private get<T>(key: string): T | undefined {
		if (!localStorage) {
			return;
		}
		try {
			return JSON.parse(localStorage.getItem(`${this.prefix}${key}`));
		} catch (e) {
			return undefined;
		}
	}

	private set<T>(key: string, data: T): void {
		if (!localStorage) {
			return;
		}
		if (data === undefined) {
			localStorage.removeItem(`${this.prefix}${key}`);
		} else {
			localStorage.setItem(this.prefix + key, JSON.stringify(data));
		}
	}

	private updateData(): void {
		if (!localStorage) {
			return;
		}
		try {
			let old = localStorage.getItem('state');
			if (old) {
				localStorage.removeItem('state');
				this.set<any>('state', JSON.parse(old));
			}
			old = localStorage.getItem('settings');
			if (old) {
				localStorage.removeItem('settings');
				this.set<any>('settings', JSON.parse(old));
			}
		} catch (e) {
			console.error(e);
		}
	}

}
