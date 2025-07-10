import { ImageSetDefault, LangDefault, ThemeDefault } from './consts';
import type { SettingsStore, StorageProvider } from './types';

export class Settings {
	lang = LangDefault;
	sounds = true;
	tileset = ImageSetDefault;
	music = false;
	contrast = false;
	dark = false;
	background = '';
	kyodaiUrl?: string;
	theme = ThemeDefault;
	stats = {
		games: 0,
		bestTime: 0
	};

	constructor(private readonly storageProvider: StorageProvider) {
	}

	load(): boolean {
		try {
			const store: SettingsStore | undefined = this.storageProvider.getSettings();
			if (store) {
				this.lang = store.lang || LangDefault;
				this.tileset = store.tileset || ImageSetDefault;
				this.background = store.background;
				this.theme = store.theme || ThemeDefault;
				this.contrast = store.contrast || false;
				this.dark = store.dark || false;
				this.sounds = store.sounds || false;
				this.music = store.music || false;
				this.kyodaiUrl = store.kyodaiUrl;
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
				music: this.music,
				contrast: this.contrast,
				dark: this.dark,
				background: this.background,
				theme: this.theme,
				tileset: this.tileset,
				kyodaiUrl: this.kyodaiUrl
			});
			return true;
		} catch (e) {
			console.error('storing settings failed', e);
		}
		return false;
	}
}
