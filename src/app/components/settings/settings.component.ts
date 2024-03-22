import {Component, ElementRef, ViewChild} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Backgrounds, ImageSets, Themes} from '../../model/consts';
import {AppService} from '../../service/app.service';
import {LayoutService} from '../../service/layout.service';
import {LocalstorageService} from '../../service/localstorage.service';
import {LANGUAGE_TITLES} from '../../i18n/languages';
import {KyodaiTileSets} from '../../modules/core/model/tilesets';
import {environment} from '../../../environments/environment';

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
	canKyodai = environment.kyodai;
	kyodaiTileSets = KyodaiTileSets;
	sets = ImageSets;
	backs = Backgrounds;
	themes = Themes;
	languages = LANGUAGE_TITLES;
	@ViewChild('kyodaiInput', {static: false}) kyodaiInput: ElementRef<HTMLInputElement>;

	constructor(
		public app: AppService,
		private storage: LocalstorageService,
		private layoutService: LayoutService,
		private translate: TranslateService
	) {
	}

	uodateKyodaiUrl(event: Event): void {
		this.app.settings.kyodaiUrl = (event.target as HTMLInputElement).value;
		this.app.settings.save();
	}

	clearKyodaiUrl(): void {
		this.app.settings.kyodaiUrl = undefined;
		this.app.settings.save()
	}

	setKyodaiUrl(event: Event): void {
		if (this.kyodaiInput.nativeElement) {
			event.preventDefault();
			event.stopPropagation();
			this.kyodaiInput.nativeElement.value = (event.target as HTMLSelectElement).value;
		}
	}

	applyKyodaiUrl(): void {
		if (this.kyodaiInput.nativeElement) {
			this.app.settings.kyodaiUrl = this.kyodaiInput.nativeElement.value;
			this.app.settings.save();
		}
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
