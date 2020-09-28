import {ImageSetDefault} from './consts';
import {SettingsStore, StorageProvider} from './types';

export class Settings {
	lang = 'auto';
	sounds = true;
	// music = false;
	tileset = ImageSetDefault;
	background = '';
	stats = {
		games: 0,
		bestTime: 0
	};

	constructor(private storageProvider: StorageProvider) {
	}

	load(): boolean {
		try {
			const store: SettingsStore | undefined = this.storageProvider.getSettings();
			if (store) {
				this.lang = store.lang || 'auto';
				this.tileset = store.tileset || ImageSetDefault;
				this.background = store.background;
				// this.music = store.music || false;
				this.sounds = store.sounds || false;
				// this.stats.games = store.games || 0;
				// this.stats.bestTime = store.bestTime || 0;
			}
			return true;
		} catch (e) {
			console.error('load settings failed', e);
		}
		return false;
	}

	save(): boolean {
		try {
			this.storageProvider.storeSettings({
				lang: this.lang,
				sounds: this.sounds,
				// music: this.music,
				background: this.background,
				tileset: this.tileset
				// games: this.stats.games,
				// bestTime: this.stats.bestTime
			});
			return true;
		} catch (e) {
			console.error('storing settings failed', e);
		}
		return false;
	}
}
