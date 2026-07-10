import { Component, type OnInit, type OutputRefSubscription, ViewContainerRef, inject, signal, viewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
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
	readonly meta = inject(Meta);
	readonly loading = signal(true);
	editorSubscription?: OutputRefSubscription;
	readonly editorVisible = signal(false);
	editorLoading: boolean = false;

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

	// the single document keydown listener, delegating to the game component (an own listener there would run every handler twice)
	handleKeyDownEvent(event: KeyboardEvent): void {
		if (this.handleEditorKeyDown(event)) {
			return;
		}
		if (!this.editorVisible()) {
			this.gameComponent().handleKeyDownEvent(event);
		}
	}

	handleEditorKeyDown(event: KeyboardEvent): boolean {
		if (!environment.editor || event.key !== 'e') {
			return false;
		}
		if (isFormControlTarget(event.target)) {
			return false;
		}
		this.toggleEditor();
		event.preventDefault();
		return true;
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
		await this.layoutService.get();
		this.loading.set(false);
		const parameters = new URLSearchParams(window.location.search);
		const layoutIDs = await this.checkImport(parameters.get('mah'));
		this.layoutService.selectBoardID = parameters.get('board') ?? layoutIDs[0];
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
		const boards = parseImportString(base64jsonString);
		const result: Array<string> = [];
		const imported: Array<LoadLayout> = [];
		for (const custom of boards) {
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
				log.warn('Failed to import individual board:', error);
			}
		}
		if (imported.length > 0) {
			this.layoutService.storeCustomBoards(imported);
		}
		if (boards.length > 0 && result.length === 0) {
			log.warn('Import completed but no valid boards were imported');
		}
		return result;
	}

	private registerWindowListeners(): void {
		window.addEventListener('beforeunload', () => {
			if (this.app.game.isRunning()) {
				this.app.game.pause();
			}
		}, { capture: false });
		window.addEventListener('blur', () => {
			if (this.app.game.isRunning()) {
				this.app.game.pause();
			}
		}, { capture: false });
		if (environment.onWindowBlur) {
			(environment.onWindowBlur as onWindowBlur)(() => {
				if (this.app.game.isRunning()) {
					this.app.game.pause();
				}
			});
			return;
		}
	}

	private updateName(): void {
		this.app.name = environment?.name ?? this.app.name;
	}
}
