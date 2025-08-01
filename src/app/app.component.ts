import { Component, type OnInit, type OutputRefSubscription, ViewContainerRef, inject, viewChild } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AppService } from './service/app.service';
import { LayoutService } from './service/layout.service';
import type { LoadLayout, MahFormat } from './model/types';
import { GameComponent } from './components/game/game-component.component';

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
	layoutService = inject(LayoutService);
	meta = inject(Meta);

	constructor() {
		this.updateName();
		this.registerWindowListeners();
	}

	ngOnInit(): void {
		this.init()
			.catch(error => {
				console.error(error);
			});
	}

	handleKeyDownEvent(event: KeyboardEvent): void {
		const nodeName = ((event.target as { nodeName?: string })?.nodeName ?? '').toLocaleLowerCase();
		if (nodeName === 'input') {
			return;
		}
		if (environment.editor && event.key === 'e') {
			this.toggleEditor();
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
				})
				.catch(error => {
					console.error(error);
				});
		}
	}

	toggleEditor(): void {
		if (environment.editor) {
			this.editorVisible = !this.editorVisible;
			if (this.editorVisible) {
				this.app.game.pause();
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
		this.layoutService.selectBoardID = layoutIDs[0] || parameters.get('board');
		if (window.location.search) {
			this.clearSearchParameters();
		}
		if (this.app.game.isIdle() || this.layoutService.selectBoardID) {
			this.gameComponent().showNewGame();
		}
	}

	private clearSearchParameters() {
		try {
			window.history.replaceState(null, '', window.location.pathname);
		} catch (error) {
			console.error(error);
		}
	}

	private async checkImport(base64jsonString: string | null): Promise<Array<string>> {
		if (!base64jsonString) {
			return [];
		}
		try {
			const result: Array<string> = [];
			const mah: MahFormat = JSON.parse(atob(base64jsonString));
			const imported: Array<LoadLayout> = [];
			for (const custom of mah.boards) {
				const layout = this.layoutService.expandLayout(custom, true);
				result.push(layout.id);
				if (
					!this.layoutService.layouts.items.some(l => l.id === layout.id) &&
					!imported.some(l => l.id === layout.id)
				) {
					imported.push(LayoutService.layout2loadLayout(layout, custom.map));
				}
			}
			if (imported.length > 0) {
				this.layoutService.storeCustomBoards(imported);
			}
			return result;
		} catch (error) {
			console.error(error);
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
	}

	private updateName(): void {
		const tag = this.meta.getTag('name=application-name');
		this.app.name = tag ? tag.content : this.app.name;
	}
}
