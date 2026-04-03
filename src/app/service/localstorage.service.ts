import { Injectable } from '@angular/core';
import type { GameStateStore, LayoutScoreStore, LoadLayout, SettingsStore, StorageProvider } from '../model/types';
import { log } from '../model/log';

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

	localStorageNotAvailable(): boolean {
		return (typeof localStorage === 'undefined' || !localStorage);
	}

	getLastPlayed(): string | undefined {
		try {
			if (this.localStorageNotAvailable()) {
				return undefined;
			}
			const key = `${this.prefix}last`;
			const result = localStorage.getItem(key);
			return result ?? undefined;
		} catch (error) {
			log.warn('localStorage.getItem failed:', error);
			return undefined;
		}
	}

	storeLastPlayed(id: string): void {
		if (this.localStorageNotAvailable()) {
			return;
		}
		const key = `${this.prefix}last`;
		try {
			if (id) {
				localStorage.setItem(key, id);
			} else {
				localStorage.removeItem(key);
			}
		} catch (error) {
			log.warn('localStorage.setItem/removeItem failed:', error);
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
		if (this.localStorageNotAvailable()) {
			return undefined;
		}
		const fullKey = `${this.prefix}${key}`;
		try {
			const s = localStorage.getItem(fullKey);
			if (!s) {
				return undefined;
			}
			return JSON.parse(s) as T;
		} catch (error) {
			// Remove corrupted entry to prevent repeated parse errors
			try {
				localStorage.removeItem(fullKey);
			} catch (removalError) {
				log.warn('Failed to remove corrupted localStorage item:', fullKey, removalError);
			}
			log.warn('Failed to parse localStorage item:', fullKey, error);
			return undefined;
		}
	}

	private set<T>(key: string, data?: T): void {
		if (this.localStorageNotAvailable()) {
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
			// Distinguish between quota errors and other errors
			if (error instanceof Error && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
				log.warn('localStorage quota exceeded:', fullKey);
			} else {
				log.warn('Failed to write localStorage item:', fullKey, error);
			}
		}
	}

	private updateData(): void {
		if (this.localStorageNotAvailable()) {
			return;
		}
		this.migrateOldEntry('state');
		this.migrateOldEntry('settings');
	}

	private migrateOldEntry(key: string): void {
		try {
			const old = localStorage.getItem(key);
			if (old) {
				try {
					this.set<unknown>(key, JSON.parse(old));
				} catch (parseError) {
					log.warn(`Failed to parse old ${key} data, removing corrupted entry:`, parseError);
				}
				localStorage.removeItem(key);
			}
		} catch (error) {
			log.warn(`Failed to migrate old ${key} data:`, error);
		}
	}
}
