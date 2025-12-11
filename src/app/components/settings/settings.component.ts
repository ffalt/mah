import { Component, ElementRef, inject, viewChild, AfterViewInit } from '@angular/core';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Backgrounds, ImageSetDefault, ImageSets, PATTERN_BACKGROUND, Themes } from '../../model/consts';
import { AppService } from '../../service/app.service';
import { LayoutService } from '../../service/layout.service';
import { LocalstorageService } from '../../service/localstorage.service';
import { LANGUAGES } from '../../model/languages';
import { KyodaiTileSets } from '../../model/tilesets';
import { environment } from '../../../environments/environment';
import { LicenseLinkComponent } from '../license-link/license-link.component';
import { generatePatternList } from '../../service/pattern.service';

const SETTINGS_TABS = [
	{ id: 'lang', name: 'LANG' },
	{ id: 'stones', name: 'TILESET' },
	{ id: 'theme', name: 'THEME' },
	{ id: 'background', name: 'BACKGROUND' },
	{ id: 'data', name: 'DATA' }
];

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss'],
	imports: [TranslatePipe, LicenseLinkComponent],
	host: {
		'(scroll)': 'onScroll($event)'
	}
})
export class SettingsComponent implements AfterViewInit {
	readonly kyodaiInput = viewChild.required<ElementRef<HTMLInputElement | HTMLTextAreaElement>>('kyodaiInput');
	readonly canKyodai = environment.kyodai;
	readonly kyodaiTileSets = KyodaiTileSets;
	readonly sets = ImageSets;
	readonly backs = Backgrounds;
	readonly themes = Themes;
	readonly PatternBackground = PATTERN_BACKGROUND;
	readonly languages = Object.keys(LANGUAGES).map(key => ({ key, title: LANGUAGES[key].title }));
	readonly app = inject(AppService);
	readonly tabs = SETTINGS_TABS;
	readonly patterns = generatePatternList();
	selectedTab: string = this.app.getCachedValue('settings.selectedTab') as string | undefined ?? SETTINGS_TABS[0].id;

	private readonly element = inject(ElementRef);
	private readonly storage = inject(LocalstorageService);
	private readonly layoutService = inject(LayoutService);
	private readonly translate = inject(TranslateService);

	ngAfterViewInit(): void {
		if (this.element?.nativeElement) {
			this.restoreScroll(this.element.nativeElement);
		}
	}

	setBackground(background: string) {
		this.app.settings.background = background;
		this.app.settings.save();
	}

	updateKyodaiUrl(event: Event): void {
		this.app.settings.kyodaiUrl = (event.target as HTMLTextAreaElement | HTMLInputElement).value;
		this.app.settings.save();
	}

	clearKyodaiUrl(): void {
		this.app.settings.kyodaiUrl = undefined;
		this.app.settings.tileset = ImageSetDefault;
		this.app.settings.save();
	}

	setKyodaiUrl(event: Event): void {
		const kyodaiInput = this.kyodaiInput();
		if (kyodaiInput.nativeElement) {
			event.preventDefault();
			event.stopPropagation();
			kyodaiInput.nativeElement.value = (event.target as HTMLSelectElement).value;
		}
	}

	applyKyodaiUrl(): void {
		const kyodaiInput = this.kyodaiInput();
		if (kyodaiInput.nativeElement) {
			this.app.settings.kyodaiUrl = kyodaiInput.nativeElement.value;
			this.app.settings.save();
		}
	}

	setSelectedTab(tab: string): void {
		this.selectedTab = tab;
		this.app.cacheValue('settings.selectedTab', tab);
	}

	restoreScroll(container: HTMLElement): void {
		if (!container) {
			return;
		}
		const pos = this.app.getCachedValue('settings.scrollTop') as number | undefined;
		setTimeout(() => container.scrollTop = pos ?? 0, 0);
	}

	onScroll(event: Event): void {
		const top = (event.target as HTMLElement).scrollTop;
		this.app.cacheValue('settings.scrollTop', top);
	}

	async clearTimes(): Promise<void> {
		const layouts = await this.layoutService.get();
		for (const layout of layouts.items) {
			this.storage.clearScore(layout.id);
		}
	}

	clearTimesClick(): void {
		if (confirm(this.translate.instant('BEST_TIMES_CLEAR_SURE'))) {
			this.clearTimes().catch(error => console.error(error));
		}
	}
}
