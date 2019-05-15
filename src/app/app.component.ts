import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Game} from './model/game';
import {LANG_DE, LANG_EN} from './model/i18n';
import {Layouts} from './model/layouts';
import {LayoutService} from './service/layout.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	game: Game = new Game();
	layouts: Layouts;
	loading = true;

	constructor(layouts: LayoutService, translate: TranslateService) {
		translate.setTranslation('en', LANG_EN);
		translate.setTranslation('de', LANG_DE);
		translate.setDefaultLang('en');
		layouts.get().then(
			data => {
				this.layouts = data;
				this.loading = false;
			})
			.catch(e => {
				console.error(e);
			});
		this.game.init();

		// does not work:
		// @HostListener('window:onbeforeunload')
		// public onBeforeUnload() {}
		// => old style!

		window.addEventListener('beforeunload', () => {
			if (this.game.isRunning()) {
				this.game.pause();
			}
		}, false);
		window.addEventListener('blur', () => {
			if (this.game.isRunning()) {
				this.game.pause();
			}
		}, false);

	}
}
