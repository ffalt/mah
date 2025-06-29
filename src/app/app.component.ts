import { Component, HostListener, inject, OnInit, OutputRefSubscription, ViewChild, ViewContainerRef } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { environment } from '../environments/environment';
import { AppService } from './service/app.service';
import { LayoutService } from './service/layout.service';
import { LoadLayout, MahFormat } from './model/types';
import { GameComponent } from './components/game/game-component.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: false
})
export class AppComponent implements OnInit {
	@ViewChild('gameComponent', {static: false}) gameComponent: GameComponent;
	@ViewChild('editorPlaceholder', {read: ViewContainerRef, static: true}) editorPlaceholder: ViewContainerRef;
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
			.catch(e => {
				console.error(e);
			});
	}

	@HostListener('document:keydown', ['$event'])
	handleKeyDownEvent(event: KeyboardEvent): void {
		const nodeName = ((event.target as { nodeName?: string })?.nodeName || '').toLocaleLowerCase();
		if (nodeName === 'input') {
			return;
		}
		if (environment.editor) {
			if (event.key === 'e') {
				this.toggleEditor();
			}
		}
	}

	loadEditor(): void {
		if (environment.editor) {
			import('./modules/editor/editor.module')
				.then(({EditorModule}) => {
					const EditorComponent = EditorModule.getEditorComponentComponent();
					const component = this.editorPlaceholder.createComponent(EditorComponent);
					this.editorSubscription = component.instance.closeEvent.subscribe(() => {
						this.toggleEditor();
					});
				}).catch(e => {
				console.error(e);
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
				this.editorPlaceholder.clear();
			}
		}
	}

	private async init(): Promise<void> {
		await this.layoutService.get();
		this.loading = false;
		const params = new URLSearchParams(window.location.search);
		const layoutIDs = await this.checkImport(params.get('mah'));
		this.layoutService.selectBoardID = layoutIDs[0] || params.get('board');
		if (window.location.search) {
			this.clearSearchParameters();
		}
		if (this.app.game.isIdle() || this.layoutService.selectBoardID) {
			this.gameComponent.showNewGame();
		}
	}

	private clearSearchParameters() {
		try {
			// eslint-disable-next-line no-null/no-null
			window.history.replaceState(null, '', window.location.pathname);
		} catch (e) {
			console.error(e);
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
			mah.boards.forEach(custom => {
				const layout = this.layoutService.expandLayout(custom, true);
				result.push(layout.id);
				if (
					!this.layoutService.layouts.items.find(l => l.id === layout.id) &&
					!imported.find(l => l.id === layout.id)
				) {
					imported.push(LayoutService.layout2loadLayout(layout, custom.map));
				}
			});
			if (imported.length > 0) {
				this.layoutService.storeCustomBoards(imported);
			}
			return result;
		} catch (e) {
			console.error(e);
			return [];
		}
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

}
