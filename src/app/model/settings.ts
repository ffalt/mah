import { signal } from '@angular/core';
import { type GAME_MODE_ID, GAME_MODE_ID_DEFAULT, GameModes, ImageSetDefault, LangDefault, ThemeDefault, Themes } from './consts';
import { type BUILD_MODE_ID, BuilderModes, MODE_SOLVABLE } from './builder';
import type { SettingsStore, StorageProvider } from './types';
import { log } from './log';

export class Settings {
	readonly lang = signal(LangDefault);
	readonly gameMode = signal<GAME_MODE_ID>(GAME_MODE_ID_DEFAULT);
	readonly buildMode = signal<BUILD_MODE_ID>(MODE_SOLVABLE);
	readonly sounds = signal(true);
	readonly tileset = signal(ImageSetDefault);
	readonly music = signal(false);
	readonly contrast = signal(false);
	readonly dark = signal(false);
	readonly tile3d = signal(true);
	readonly shadows = signal(true);
	readonly animations = signal(true);
	readonly tileAnimations = signal(true);
	readonly hintAnimations = signal(true);
	readonly confetti = signal(true);
	readonly showClock = signal(true);
	readonly showDailyChallenge = signal(true);
	readonly rotateBoard = signal(true);
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
				this.loadValidated(store);
				this.lang.set(store.lang ?? LangDefault);
				this.tileset.set(store.tileset ?? ImageSetDefault);
				this.background.set(store.background ?? this.background());
				this.pattern.set(store.pattern);
				this.contrast.set(store.contrast ?? false);
				this.dark.set(store.dark ?? false);
				this.tile3d.set(store.tile3d ?? true);
				this.shadows.set(store.shadows ?? true);
				this.animations.set(store.animations ?? true);
				this.tileAnimations.set(store.tileAnimations ?? true);
				this.hintAnimations.set(store.hintAnimations ?? true);
				this.confetti.set(store.confetti ?? true);
				this.showClock.set(store.showClock ?? true);
				this.showDailyChallenge.set(store.showDailyChallenge ?? true);
				this.rotateBoard.set(store.rotateBoard ?? true);
				this.sounds.set(store.sounds ?? this.sounds());
				this.music.set(store.music ?? this.music());
				this.kyodaiUrl.set(store.kyodaiUrl);
				this.tutorialCompleted.set(store.tutorialCompleted ?? true);
			}
			return true;
		} catch (error) {
			log.error('load settings failed', error);
		}
		return false;
	}

	private loadValidated(store: SettingsStore): void {
		this.theme.set(this.validTheme(store.theme) ? store.theme : ThemeDefault);
		this.gameMode.set(this.validGameMode(store.gameMode) ? store.gameMode : GAME_MODE_ID_DEFAULT);
		this.buildMode.set(this.validBuildMode(store.buildMode) ? store.buildMode : MODE_SOLVABLE);
	}

	validTheme(theme?: string): boolean {
		return !!(theme && Themes.some(t => t.id === theme));
	}

	validGameMode(mode?: string): mode is GAME_MODE_ID {
		return GameModes.some(entry => entry.id === mode);
	}

	validBuildMode(mode?: string): mode is BUILD_MODE_ID {
		return BuilderModes.some(entry => entry.id === mode);
	}

	save(): boolean {
		try {
			this.storageProvider.storeSettings({
				lang: this.lang(),
				gameMode: this.gameMode(),
				buildMode: this.buildMode(),
				sounds: this.sounds(),
				music: this.music(),
				contrast: this.contrast(),
				dark: this.dark(),
				tile3d: this.tile3d(),
				shadows: this.shadows(),
				animations: this.animations(),
				tileAnimations: this.tileAnimations(),
				hintAnimations: this.hintAnimations(),
				confetti: this.confetti(),
				showClock: this.showClock(),
				showDailyChallenge: this.showDailyChallenge(),
				rotateBoard: this.rotateBoard(),
				background: this.background(),
				pattern: this.pattern(),
				theme: this.theme(),
				tileset: this.tileset(),
				kyodaiUrl: this.kyodaiUrl(),
				tutorialCompleted: this.tutorialCompleted()
			});
			return true;
		} catch (error) {
			log.error('storing settings failed', error);
		}
		return false;
	}
}
