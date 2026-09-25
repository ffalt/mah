import { Component, DestroyRef, EnvironmentInjector, type OnInit, type OutputRefSubscription, ViewContainerRef, createEnvironmentInjector, inject, signal, viewChild } from '@angular/core';
import { TranslateService, provideChildTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { AppService } from './service/app.service';
import { LayoutService } from './service/layout.service';
import { log } from './model/log';
import type { LoadLayout } from './model/types';
import { parseImportString } from './model/import';
import { GameComponent } from './components/game/game-component.component';
import { isFormControlTarget } from './model/dom-utilities';

type onWindowBlur = (callback: () => void) => void;

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	host: { '(document:keydown)': 'handleKeyDownEvent($event)' },
	imports: [GameComponent]
})
export class AppComponent implements OnInit {
	readonly gameComponent = viewChild.required<GameComponent>('gameComponent');
	readonly editorPlaceholder = viewChild.required('editorPlaceholder', { read: ViewContainerRef });
	readonly app = inject(AppService);
	readonly layoutService = inject(LayoutService);
	readonly loading = signal(true);
	editorSubscription?: OutputRefSubscription;
	readonly editorVisible = signal(false);
	editorLoading: boolean = false;
	private readonly environmentInjector = inject(EnvironmentInjector);
	private readonly lifecycle = inject(DestroyRef);
	private editorInjector?: EnvironmentInjector;

	constructor() {
		this.updateName();
		this.markNativeShell();
		this.registerWindowListeners();
	}

	ngOnInit(): void {
		this.init()
			.catch(error => {
				log.error(error);
			});
	}

	handleKeyDownEvent(event: KeyboardEvent): void {
		if (this.handleEditorKeyDown(event)) {
			return;
		}
		if (!this.editorVisible()) {
			this.gameComponent().handleKeyDownEvent(event);
		}
	}

	handleEditorKeyDown(event: KeyboardEvent): boolean {
		if (
			!environment.editor ||
			event.key !== 'e' ||
			this.editorVisible() ||
			isFormControlTarget(event.target) ||
			this.gameComponent().isDialogVisible()
		) {
			return false;
		}
		this.toggleEditor();
		event.preventDefault();
		return true;
	}

	loadEditor(): void {
		if (environment.editor) {
			this.createEditor()
				.catch(error => {
					log.error(error);
					this.editorLoading = false;
					this.editorVisible.set(false);
				});
		}
	}

	private async createEditor(): Promise<void> {
		this.editorInjector ??= createEnvironmentInjector([
			provideChildTranslateService({
				loader: provideTranslateHttpLoader({ prefix: './assets/i18n/editor/', suffix: '.json' })
			})
		], this.environmentInjector, 'EditorTranslations');
		const [{ EditorComponent }] = await Promise.all([
			this.importEditorModule(),
			this.awaitEditorTranslations(this.editorInjector)
		]);
		const component = this.editorPlaceholder()
			.createComponent(EditorComponent, { environmentInjector: this.editorInjector });
		this.editorSubscription = component.instance.closeEvent.subscribe(() => {
			this.toggleEditor();
		});
		this.editorLoading = false;
	}

	private async awaitEditorTranslations(injector: EnvironmentInjector): Promise<unknown> {
		return firstValueFrom(injector.get(TranslateService).get('EDITOR_TITLE'));
	}

	private async importEditorModule(): Promise<typeof import('./modules/editor/components/editor/editor.component')> {
		return import('./modules/editor/components/editor/editor.component');
	}

	toggleEditor(): void {
		if (!environment.editor || this.editorLoading) {
			return;
		}
		this.editorVisible.update(visible => !visible);
		if (this.editorVisible()) {
			this.app.game.pause();
			this.editorLoading = true;
			this.loadEditor();
		} else {
			if (this.editorSubscription) {
				this.editorSubscription.unsubscribe();
				this.editorSubscription = undefined;
			}
			this.editorPlaceholder().clear();
		}
	}

	private async init(): Promise<void> {
		try {
			await this.layoutService.get();
			const parameters = new URLSearchParams(window.location.search);
			const layoutIDs = await this.checkImport(parameters.get('mah'));
			this.layoutService.selectLayoutID = parameters.get('board') ?? layoutIDs[0];
			if (window.location.search) {
				this.clearSearchParameters();
			}
			if (this.app.game.isIdle() || this.layoutService.selectLayoutID) {
				this.gameComponent().start();
			}
		} finally {
			this.loading.set(false);
		}
	}

	private clearSearchParameters() {
		try {
			window.history.replaceState(null, '', window.location.pathname);
		} catch (error) {
			log.error(error);
		}
	}

	private async checkImport(base64jsonString: string | null): Promise<Array<string>> {
		const layouts = parseImportString(base64jsonString);
		const result: Array<string> = [];
		const imported: Array<LoadLayout> = [];
		for (const custom of layouts) {
			try {
				const layout = this.layoutService.expandLayout(custom, true);
				result.push(layout.id);
				if (
					this.layoutService.layouts.items.every(l => l.id !== layout.id) &&
					imported.every(l => l.id !== layout.id)
				) {
					imported.push(LayoutService.layout2loadLayout(layout, custom.map));
				}
			} catch (error) {
				log.warn('Failed to import custom layout:', error);
			}
		}
		if (imported.length > 0) {
			this.layoutService.storeCustomLayouts(imported);
		}
		if (layouts.length > 0 && result.length === 0) {
			log.warn('Import completed but no valid layouts were imported');
		}
		return result;
	}

	private registerWindowListeners(): void {
		const pause = (): void => {
			if (this.app.game.isRunning()) {
				this.app.game.pause();
			}
		};
		const onVisibilityChange = (): void => {
			if (document.visibilityState === 'hidden') {
				pause();
			}
		};
		window.addEventListener('beforeunload', pause);
		window.addEventListener('blur', pause);
		window.addEventListener('pagehide', pause);
		document.addEventListener('visibilitychange', onVisibilityChange);
		this.lifecycle.onDestroy(() => {
			window.removeEventListener('beforeunload', pause);
			window.removeEventListener('blur', pause);
			window.removeEventListener('pagehide', pause);
			document.removeEventListener('visibilitychange', onVisibilityChange);
		});
		if (environment.onWindowBlur) {
			(environment.onWindowBlur as onWindowBlur)(pause);
		}
	}

	private updateName(): void {
		this.app.name = environment?.name ?? this.app.name;
	}

	private markNativeShell(): void {
		if (environment.mobile) {
			document.documentElement.classList.add('native');
		}
	}
}
