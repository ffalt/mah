import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Game } from '../model/game';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../model/languages';
import { Settings } from '../model/settings';
import { LangAuto } from '../model/consts';
import { LocalstorageService } from './localstorage.service';

@Injectable()
export class AppService {
	name: string = 'Mah Jong';
	game: Game;
	settings: Settings;
	storage = inject(LocalstorageService);
	translate = inject(TranslateService);

	constructor() {
		this.game = new Game(this.storage);
		this.settings = new Settings(this.storage);
		this.settings.load();
		this.setLang();
		this.game.init();
		this.game.sound.enabled = this.settings.sounds;
		this.game.music.enabled = this.settings.music;
	}

	setLang(): void {
		const userLang =
			(!this.settings.lang || this.settings.lang === LangAuto) ?
				(navigator.language.split('-')[0] || DEFAULT_LANGUAGE).toLowerCase() : // use navigator lang if available
				this.settings.lang;
		if (Object.keys(LANGUAGES).includes(userLang)) {
			this.translate.use(userLang);
		} else {
			this.translate.use(DEFAULT_LANGUAGE);
		}
	}

	toggleSound(): void {
		this.settings.sounds = !this.settings.sounds;
		this.game.sound.enabled = this.settings.sounds;
		this.settings.save();
	}

	toggleMusic(): void {
		this.settings.music = !this.settings.music;
		this.game.music.enabled = this.settings.music;
		this.game.music.toggle();
		this.settings.save();
	}
}
