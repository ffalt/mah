import { signal } from '@angular/core';
import { ImageSetDefault, LangDefault, ThemeDefault } from './consts';
import type { SettingsStore, StorageProvider } from './types';

export class Settings {
	readonly lang = signal(LangDefault);
	readonly sounds = signal(true);
	readonly tileset = signal(ImageSetDefault);
	readonly music = signal(false);
	readonly contrast = signal(false);
	readonly dark = signal(false);
	readonly tile3d = signal(false);
	readonly confetti = signal(true);
	readonly showClock = signal(true);
	readonly background = signal('');
	readonly pattern = signal<string | undefined>(undefined);
	readonly kyodaiUrl = signal<string | undefined>(undefined);
	readonly theme = signal(ThemeDefault);
	readonly tutorialCompleted = signal(false);
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
				this.lang.set(store.lang ?? LangDefault);
				this.tileset.set(store.tileset ?? ImageSetDefault);
				this.background.set(store.background ?? this.background());
				this.pattern.set(store.pattern);
				this.theme.set(store.theme ?? ThemeDefault);
				this.contrast.set(store.contrast ?? false);
				this.dark.set(store.dark ?? false);
				this.tile3d.set(store.tile3d ?? false);
				this.confetti.set(store.confetti ?? true);
				this.showClock.set(store.showClock ?? true);
				this.sounds.set(store.sounds ?? this.sounds());
				this.music.set(store.music ?? this.music());
				this.kyodaiUrl.set(store.kyodaiUrl);
				this.tutorialCompleted.set(store.tutorialCompleted ?? true);
			}
			return true;
		} catch (error) {
			console.error('load settings failed', error);
		}
		return false;
	}

	save(): boolean {
		try {
			this.storageProvider.storeSettings({
				lang: this.lang(),
				sounds: this.sounds(),
				music: this.music(),
				contrast: this.contrast(),
				dark: this.dark(),
				tile3d: this.tile3d(),
				confetti: this.confetti(),
				showClock: this.showClock(),
				background: this.background(),
				pattern: this.pattern(),
				theme: this.theme(),
				tileset: this.tileset(),
				kyodaiUrl: this.kyodaiUrl(),
				tutorialCompleted: this.tutorialCompleted()
			});
			return true;
		} catch (error) {
			console.error('storing settings failed', error);
		}
		return false;
	}
}
