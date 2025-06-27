import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Game } from '../model/game';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../i18n/languages';
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
		this.setupTranslations();
		this.setLang();
		this.game.init();
		this.game.sound.enabled = this.settings.sounds;
	}

	setLang(): void {
		let userLang: string;
		if (!this.settings.lang || this.settings.lang === LangAuto) {
			userLang = (navigator.language.split('-')[0] || DEFAULT_LANGUAGE).toLowerCase(); // use navigator lang if available
		} else {
			userLang = this.settings.lang;
		}
		if (Object.keys(LANGUAGES).indexOf(userLang) >= 0) {
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

	private setupTranslations(): void {
		Object.keys(LANGUAGES).forEach(key => {
			this.translate.setTranslation(key, LANGUAGES[key].data);
		});
		this.translate.setDefaultLang(DEFAULT_LANGUAGE);
	}

}
