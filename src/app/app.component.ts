import {Component} from '@angular/core';
import {Meta} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {LANG_DE, LANG_EN} from './model/i18n';
import {Layouts} from './model/types';
import {AppService} from './service/app.service';
import {LayoutService} from './service/layout.service';
import {LocalstorageService} from './service/localstorage.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	layouts: Layouts;
	loading = true;

	constructor(private layoutService: LayoutService, private storage: LocalstorageService, private translate: TranslateService, private meta: Meta, public app: AppService) {
		this.updateName();
		this.setupTranslations();
		this.loadLayouts();
		this.registerWindowListeners();
	}

	private loadLayouts(): void {
		this.layoutService.get().then(
			data => {
				this.layouts = data;
				this.loading = false;
			})
			.catch(e => {
				console.error(e);
			});
	}

	private registerWindowListeners(): void {
		// does not work:
		// @HostListener('window:onbeforeunload')
		// public onBeforeUnload() {}
		// => old style!
		window.addEventListener('beforeunload', () => {
			if (this.app.game.isRunning()) {
				this.app.game.pause();
			}
		}, false);
		window.addEventListener('blur', () => {
			if (this.app.game.isRunning()) {
				this.app.game.pause();
			}
		}, false);
	}

	private updateName(): void {
		const tag = this.meta.getTag('name=application-name');
		this.app.name = tag ? tag.content : this.app.name;
	}

	private setupTranslations(): void {
		this.translate.setTranslation('en', LANG_EN);
		this.translate.setTranslation('de', LANG_DE);
		this.translate.setDefaultLang('en');
	}
}
