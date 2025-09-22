import { Injectable } from '@angular/core';
import type { GameStateStore, LayoutScoreStore, LoadLayout, SettingsStore, StorageProvider } from '../model/types';

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

	setLastMirrorX(value: string): void {
		this.set('mirrorx', value);
	}

	setLastMirrorY(value: string): void {
		this.set('mirrory', value);
	}

	getLastMirrorX(): string | undefined {
		return this.get<string | undefined>('mirrorx');
	}

	getLastMirrorY(): string | undefined {
		return this.get<string | undefined>('mirrory');
	}

	getLastPlayed(): string | undefined {
		if (typeof localStorage === 'undefined') {
			return;
		}
		try {
			const result = localStorage.getItem('last');
			return result ?? undefined;
		} catch (error) {
			console.error(error);
		}
		return;
	}

	storeLastPlayed(id: string): void {
		if (typeof localStorage === 'undefined') {
			return;
		}
		try {
			if (id) {
				localStorage.setItem('last', id);
			} else {
				localStorage.removeItem('last');
			}
		} catch (error) {
			console.error(error);
		}
	}

	storeScore(id: string, store?: LayoutScoreStore): void {
		this.set<LayoutScoreStore>(`score.${id}`, store);
	}

	clearScore(id: string): void {
		this.set<LayoutScoreStore>(`score.${id}`);
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
		if (typeof localStorage === 'undefined') {
			return;
		}
		const fullKey = `${this.prefix}${key}`;
		try {
			const s = localStorage.getItem(fullKey);
			if (!s) {
				return;
			}
			return JSON.parse(s) as T;
		} catch (error) {
			// Remove corrupted entry to prevent repeated parse errors
			try {
				localStorage.removeItem(fullKey);
			} catch {
				// ignore removal errors
			}
			console.error('Failed to parse localStorage item', fullKey, error);
			return;
		}
	}

	private set<T>(key: string, data?: T): void {
		if (typeof localStorage === 'undefined') {
			return;
		}
		const fullKey = `${this.prefix}${key}`;
		try {
			if (data === undefined) {
				localStorage.removeItem(fullKey);
			} else {
				localStorage.setItem(fullKey, JSON.stringify(data));
			}
		} catch (error) {
			console.error('Failed to write localStorage item', fullKey, error);
		}
	}

	private updateData(): void {
		if (typeof localStorage === 'undefined') {
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
		} catch (error) {
			console.error(error);
		}
	}
}
