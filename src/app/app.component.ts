import {Component, HostListener, ViewChild, ViewContainerRef} from '@angular/core';
import {Meta} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {environment} from '../environments/environment';
import {AppService} from './service/app.service';
import {LayoutService} from './service/layout.service';
import {LocalstorageService} from './service/localstorage.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {
	loading = true;
	@ViewChild('editorPlaceholder', {read: ViewContainerRef, static: true})
	editorPlaceholder: ViewContainerRef;
	editorSubscription?: Subscription;
	editorVisible: boolean = false;

	constructor(private layoutService: LayoutService, private storage: LocalstorageService,
							private translate: TranslateService, private meta: Meta, public app: AppService) {
		this.updateName();
		this.loadLayouts();
		this.registerWindowListeners();
	}

	@HostListener('document:keydown', ['$event'])
	handleKeyDownEvent(event: KeyboardEvent): void {
		const nodeName = ((event.target as any)?.nodeName || '').toLocaleLowerCase();
		if (nodeName === 'input') {
			return;
		}
		if (environment.editor) {
			if (event.which === 69) { // e
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

	private loadLayouts(): void {
		this.layoutService.get().then(
			() => {
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

}
