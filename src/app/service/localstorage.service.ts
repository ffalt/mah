import { Service, signal } from '@angular/core';
import type { DailyMetaStore, DailyMonthStore, GameStateStore, LayoutScoreStore, LoadLayout, SettingsStore, StorageProvider } from '../model/types';
import { log } from '../model/log';

@Service()
export class LocalstorageService implements StorageProvider {
	readonly persistent = signal(true);
	private readonly prefix = 'mah.';

	constructor() {
		this.updateData();
	}

	getScore(id: string): LayoutScoreStore | undefined {
		return this.get<LayoutScoreStore>(`score.${id}`);
	}

	getScores(): Map<string, LayoutScoreStore> {
		const scores = new Map<string, LayoutScoreStore>();
		const storage = this.storage();
		if (!storage) {
			return scores;
		}
		// collect the ids first: reading via get() can remove corrupted entries, which would shift the key indices
		const scorePrefix = `${this.prefix}score.`;
		const ids: Array<string> = [];
		try {
			for (let index = 0; index < storage.length; index++) {
				const key = storage.key(index);
				if (key?.startsWith(scorePrefix)) {
					ids.push(key.slice(scorePrefix.length));
				}
			}
		} catch (error) {
			log.warn('localStorage.key failed:', error);
		}
		for (const id of ids) {
			const score = this.getScore(id);
			if (score) {
				scores.set(id, score);
			}
		}
		return scores;
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
		const storage = this.storage();
		if (!storage) {
			return undefined;
		}
		try {
			return storage.getItem(`${this.prefix}last`) ?? undefined;
		} catch (error) {
			log.warn('localStorage.getItem failed:', error);
			return undefined;
		}
	}

	storeLastPlayed(id: string): void {
		const storage = this.storage();
		if (!storage) {
			return;
		}
		const key = `${this.prefix}last`;
		try {
			if (id) {
				storage.setItem(key, id);
			} else {
				storage.removeItem(key);
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

	getDailyMonth(monthKey: string): DailyMonthStore | undefined {
		return this.get<DailyMonthStore>(`daily.${monthKey}`);
	}

	storeDailyMonth(monthKey: string, store?: DailyMonthStore): void {
		this.set<DailyMonthStore>(`daily.${monthKey}`, store);
	}

	getDailyMonthKeys(): Array<string> {
		const keys: Array<string> = [];
		const storage = this.storage();
		if (!storage) {
			return keys;
		}
		const dailyPrefix = `${this.prefix}daily.`;
		try {
			for (let index = 0; index < storage.length; index++) {
				const key = storage.key(index);
				if (key?.startsWith(dailyPrefix)) {
					const monthKey = key.slice(dailyPrefix.length);
					// skip the aggregate, it is not a month record
					if (monthKey !== 'meta') {
						keys.push(monthKey);
					}
				}
			}
		} catch (error) {
			log.warn('localStorage.key failed:', error);
		}
		return keys;
	}

	getDailyMeta(): DailyMetaStore | undefined {
		return this.get<DailyMetaStore>('daily.meta');
	}

	storeDailyMeta(store?: DailyMetaStore): void {
		this.set<DailyMetaStore>('daily.meta', store);
	}

	// reading the global can throw when storage access is denied, so it is never touched outside this guard
	private storage(): Storage | undefined {
		try {
			if (typeof localStorage === 'undefined' || !localStorage) {
				return this.reportUnavailable();
			}
			this.persistent.set(true);
			return localStorage;
		} catch (error) {
			return this.reportUnavailable(error);
		}
	}

	private reportUnavailable(...details: Array<unknown>): undefined {
		if (this.persistent()) {
			this.persistent.set(false);
			log.warn('localStorage is not available, saving and loading is disabled', ...details);
		}
		return undefined;
	}

	private get<T>(key: string): T | undefined {
		const storage = this.storage();
		if (!storage) {
			return undefined;
		}
		const fullKey = `${this.prefix}${key}`;
		try {
			const s = storage.getItem(fullKey);
			if (!s) {
				return undefined;
			}
			return JSON.parse(s) as T;
		} catch (error) {
			// Remove corrupted entry to prevent repeated parse errors
			try {
				storage.removeItem(fullKey);
			} catch (removalError) {
				log.warn('Failed to remove corrupted localStorage item:', fullKey, removalError);
			}
			log.warn('Failed to parse localStorage item:', fullKey, error);
			return undefined;
		}
	}

	private set<T>(key: string, data?: T): void {
		const storage = this.storage();
		if (!storage) {
			return;
		}
		const fullKey = `${this.prefix}${key}`;
		try {
			if (data === undefined) {
				storage.removeItem(fullKey);
			} else {
				storage.setItem(fullKey, JSON.stringify(data));
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
		this.migrateOldEntry('state');
		this.migrateOldEntry('settings');
	}

	private migrateOldEntry(key: string): void {
		const storage = this.storage();
		if (!storage) {
			return;
		}
		try {
			const old = storage.getItem(key);
			if (old) {
				if (storage.getItem(`${this.prefix}${key}`) === null) {
					try {
						this.set<unknown>(key, JSON.parse(old));
					} catch (parseError) {
						log.warn(`Failed to parse old ${key} data, removing corrupted entry:`, parseError);
					}
				}
				storage.removeItem(key);
			}
		} catch (error) {
			log.warn(`Failed to migrate old ${key} data:`, error);
		}
	}
}
