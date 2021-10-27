import {Component} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Backgrounds, ImageSets} from '../../model/consts';
import {AppService} from '../../service/app.service';
import {LayoutService} from '../../service/layout.service';
import {LocalstorageService} from '../../service/localstorage.service';
import {LANGUAGE_TITLES} from '../../i18n/languages';

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
	sets = ImageSets;
	backs = Backgrounds;
	languages = LANGUAGE_TITLES;

	constructor(
		public app: AppService,
		private storage: LocalstorageService,
		private layoutService: LayoutService,
		private translate: TranslateService
	) {
	}

	async clearTimes(): Promise<void> {
		const layouts = await this.layoutService.get();
		for (const layout of layouts.items) {
			this.storage.clearScore(layout.id);
		}
	}

	clearTimesClick(): void {
		if (confirm(this.translate.instant('BEST_TIMES_CLEAR_SURE'))) {
			this.clearTimes().catch(e => {
				console.error(e);
			});
		}
	}

}
