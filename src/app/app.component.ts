import { Component, type OnInit, type OutputRefSubscription, ViewContainerRef, inject, viewChild, NgZone } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AppService } from './service/app.service';
import { LayoutService } from './service/layout.service';
import { log } from './model/log';
import type { LoadLayout, MahFormat } from './model/types';
import { GameComponent } from './components/game/game-component.component';

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
	app = inject(AppService);
	loading = true;
	editorSubscription?: OutputRefSubscription;
	editorVisible: boolean = false;
	editorLoading: boolean = false;
	layoutService = inject(LayoutService);
	ngZone = inject(NgZone);
	meta = inject(Meta);

	constructor() {
		this.updateName();
		this.registerWindowListeners();
	}

	ngOnInit(): void {
		this.init()
			.catch(error => {
				log.error(error);
			});
	}

	handleKeyDownEvent(event: KeyboardEvent): void {
		const target = event.target;
		if (!target) {
			return;
		}
		const nodeName = target instanceof Element ? target.nodeName.toLowerCase() : '';
		if (nodeName === 'input') {
			return;
		}
		if (environment.editor && event.key === 'e') {
			this.toggleEditor();
			event.preventDefault();
		}
	}

	loadEditor(): void {
		if (environment.editor) {
			import('./modules/editor/components/editor/editor.component')
				.then(({ EditorComponent }) => {
					const component = this.editorPlaceholder().createComponent(EditorComponent);
					this.editorSubscription = component.instance.closeEvent.subscribe(() => {
						this.toggleEditor();
					});
					this.editorLoading = false;
				})
				.catch(error => {
					log.error(error);
					this.editorLoading = false;
				});
		}
	}

	toggleEditor(): void {
		if (environment.editor) {
			if (this.editorLoading) {
				return;
			}
			this.editorVisible = !this.editorVisible;
			if (this.editorVisible) {
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
	}

	private async init(): Promise<void> {
		await this.layoutService.get();
		this.loading = false;
		const parameters = new URLSearchParams(window.location.search);
		const layoutIDs = await this.checkImport(parameters.get('mah'));
		this.layoutService.selectBoardID = parameters.get('board') || layoutIDs[0];
		if (window.location.search) {
			this.clearSearchParameters();
		}
		if (this.app.game.isIdle() || this.layoutService.selectBoardID) {
			this.gameComponent().start();
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
		if (!base64jsonString) {
			return [];
		}
		try {
			let decoded: string;
			try {
				decoded = atob(base64jsonString);
			} catch (error) {
				log.warn('Import failed: Invalid base64 encoding', error);
				return [];
			}

			let parsed: unknown;
			try {
				parsed = JSON.parse(decoded);
			} catch (error) {
				log.warn('Import failed: Invalid JSON format', error);
				return [];
			}

			const mah = parsed as MahFormat;
			if (!mah.mah || mah.mah !== '1.0') {
				log.warn('Import failed: Invalid or unsupported MAH format version');
				return [];
			}

			if (!Array.isArray(mah.boards)) {
				log.warn('Import failed: Missing or invalid boards array');
				return [];
			}

			if (mah.boards.length === 0) {
				log.warn('Import failed: No boards found in import data');
				return [];
			}

			const result: Array<string> = [];
			const imported: Array<LoadLayout> = [];
			for (const custom of mah.boards) {
				try {
					const layout = this.layoutService.expandLayout(custom, true);
					result.push(layout.id);
					if (
						!this.layoutService.layouts.items.some(l => l.id === layout.id) &&
						!imported.some(l => l.id === layout.id)
					) {
						imported.push(LayoutService.layout2loadLayout(layout, custom.map));
					}
				} catch (error) {
					log.warn('Failed to import individual board:', error);
				}
			}

			if (imported.length > 0) {
				this.layoutService.storeCustomBoards(imported);
			}

			if (result.length === 0) {
				log.warn('Import completed but no valid boards were imported');
			}

			return result;
		} catch (error) {
			log.error('Unexpected error during import:', error);
			return [];
		}
	}

	private registerWindowListeners(): void {
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
		if (environment.onWindowBlur) {
			(environment.onWindowBlur as onWindowBlur)(() => {
				if (this.app.game.isRunning()) {
					this.ngZone.run(() => {
						this.app.game.pause();
					});
				}
			});
			return;
		}
	}

	private updateName(): void {
		this.app.name = environment?.name ?? this.app.name;
	}
}
