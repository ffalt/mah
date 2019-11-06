import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Game} from '../model/game';
import {LANG_DE, LANG_EN} from '../model/i18n';
import {Settings} from '../model/settings';
import {LocalstorageService} from './localstorage.service';

@Injectable()
export class AppService {
	name: string = 'Mah Jong';
	game: Game;
	settings: Settings;

	constructor(private storage: LocalstorageService, private translate: TranslateService) {
		this.game = new Game(storage);
		this.settings = new Settings(storage);
		this.settings.load();
		this.setupTranslations();
		this.setLang();
		this.game.init();
	}

	setLang(): void {
		let userLang: string;
		if (!this.settings.lang || this.settings.lang === 'auto') {
			userLang = navigator.language.split('-')[0]; // use navigator lang if available
			userLang = /(de|en)/gi.test(userLang) ? userLang : 'en';
		} else {
			userLang = this.settings.lang;
		}
		if (['de', 'en'].indexOf(userLang) >= 0) {
			this.translate.use(userLang);
		}
	}

	toggleSound(): void {
		this.settings.sounds = !this.settings.sounds;
		this.game.sound.enabled = this.settings.sounds;
		this.settings.save();
	}

	private setupTranslations(): void {
		this.translate.setTranslation('en', LANG_EN);
		this.translate.setTranslation('de', LANG_DE);
		this.translate.setDefaultLang('en');
	}

}
