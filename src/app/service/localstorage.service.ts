import {Injectable} from '@angular/core';
import {GameStateStore, LayoutScoreStore, LoadLayout, SettingsStore, StorageProvider} from '../model/types';

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

	getCustomLayouts(): Array<LoadLayout> | undefined {
		return this.get<Array<LoadLayout>>('boards');
	}

	getLastPlayed(): string | undefined {
		if (!localStorage) {
			return;
		}
		try {
			const result = localStorage.getItem('last');
			return result || undefined;
		} catch (e) {
			console.error(e);
		}
		return;
	}

	storeLastPlayed(id: string): void {
		if (!localStorage) {
			return;
		}
		try {
			if (!id) {
				localStorage.removeItem('last');
			} else {
				localStorage.setItem('last', id);
			}
		} catch (e) {
			console.error(e);
		}
	}

	storeScore(id: string, store?: LayoutScoreStore): void {
		this.set<LayoutScoreStore>(`score.${id}`, store);
	}

	clearScore(id: string): void {
		this.set<LayoutScoreStore>(`score.${id}`, undefined);
	}

	storeSettings(store?: SettingsStore): void {
		this.set<SettingsStore>('settings', store);
	}

	storeState(store?: GameStateStore): void {
		this.set<GameStateStore>('state', store);
	}

	storeCustomLayouts(layouts?: Array<LoadLayout>): void {
		this.set<Array<LoadLayout>>('boards', layouts);
	}

	private get<T>(key: string): T | undefined {
		if (!localStorage) {
			return;
		}
		try {
			const s = localStorage.getItem(`${this.prefix}${key}`);
			if (!s) {
				return;
			}
			return JSON.parse(s);
		} catch (e) {
			return;
		}
	}

	private set<T>(key: string, data?: T): void {
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
				this.set<unknown>('state', JSON.parse(old));
			}
			old = localStorage.getItem('settings');
			if (old) {
				localStorage.removeItem('settings');
				this.set<unknown>('settings', JSON.parse(old));
			}
		} catch (e) {
			console.error(e);
		}
	}

}
