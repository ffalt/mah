import {Component} from '@angular/core';
import {ImagePreloader} from './model/preloader';
import {Tiles} from './model/tiles';
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
	public loaded = '';

	constructor(layouts: LayoutService, translate: TranslateService) {
		translate.setTranslation('en', LANG_EN);
		translate.setTranslation('de', LANG_DE);
		translate.setDefaultLang('en');
		const loader = new ImagePreloader();
		const tiles = new Tiles();
		tiles.list.forEach((tile) => {
			loader.add('assets/img/tiles/' + tile.img.id + '.png');
		});
		loader.start(() => {
			this.loading = false;
		}, (progress: number) => {
			this.loaded = (progress * 100).toFixed(2) + '%';
		});
		layouts.get((res: Layouts) => {
			this.layouts = res;
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
