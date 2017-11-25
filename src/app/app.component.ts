import {Component} from '@angular/core';
import {Game} from './model/game';
import {LayoutService} from './service/layout.service';
import {Layouts} from './model/layouts';
import {TranslateService} from '@ngx-translate/core';
import {LANG_DE, LANG_EN} from './model/i18n';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	public game: Game = new Game();
	public layouts: Layouts;
	public loading = true;

	constructor(layouts: LayoutService, translate: TranslateService) {
		translate.setTranslation('en', LANG_EN);
		translate.setTranslation('de', LANG_DE);
		translate.setDefaultLang('en');
		layouts.get((res: Layouts) => {
			this.layouts = res;
			this.loading = false;
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
			return null;
		}, false);
		window.addEventListener('blur', () => {
			if (this.game.isRunning()) {
				this.game.pause();
			}
		}, false);

	}
}
