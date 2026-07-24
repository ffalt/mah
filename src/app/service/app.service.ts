import { type OnDestroy, inject, signal, Service } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, type Subscription } from 'rxjs';
import { Game } from '../model/game';
import { DEFAULT_LANGUAGE, LANGUAGES } from '../model/languages';
import { Settings } from '../model/settings';
import { LangAuto } from '../model/consts';
import { LocalstorageService } from './localstorage.service';

@Service()
export class AppService implements OnDestroy {
	name: string = 'Mah Jong';
	cache: Record<string, unknown> = {};
	game: Game;
	settings: Settings;
	storage = inject(LocalstorageService);
	translate = inject(TranslateService);
	readonly lang = signal<string>('');

	private readonly langSubscription: Subscription;

	constructor() {
		this.game = new Game(this.storage);
		this.settings = new Settings(this.storage);
		this.settings.load();
		this.langSubscription = this.translate.onLangChange.subscribe(event => this.lang.set(event.lang));
		this.game.init();
		this.game.sound.enabled = this.settings.sounds();
		this.game.music.enabled = this.settings.music();
	}

	ngOnDestroy(): void {
		this.langSubscription.unsubscribe();
		this.game.destroy();
	}

	getCachedValue(name: string): unknown {
		return this.cache[name];
	}

	cacheValue(name: string, value?: unknown): void {
		if (value === undefined) {
			delete this.cache[name];
			return;
		}
		this.cache[name] = value;
	}

	setLang(): void {
		this.translate.use(this.resolveLang());
	}

	async preloadLang(): Promise<void> {
		await firstValueFrom(this.translate.use(this.resolveLang()));
	}

	toggleSound(): void {
		this.settings.sounds.set(!this.settings.sounds());
		this.game.sound.enabled = this.settings.sounds();
		this.settings.save();
	}

	toggleMusic(): void {
		this.settings.music.set(!this.settings.music());
		this.game.music.enabled = this.settings.music();
		this.game.music.toggle();
		this.settings.save();
	}

	private resolveLang(): string {
		const lang = this.settings.lang();
		const userLang =
			(!lang || lang === LangAuto) ?
				(navigator.language.split('-', 1)[0] || DEFAULT_LANGUAGE).toLowerCase() : // use navigator lang if available
				lang;
		return Object.keys(LANGUAGES).includes(userLang) ? userLang : DEFAULT_LANGUAGE;
	}
}
