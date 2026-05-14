import { Component, inject, Injector, viewChild } from '@angular/core';
import type { Game } from '../../model/game';
import type { Stone } from '../../model/stone';
import type { Layout, Place } from '../../model/types';
import { AppService } from '../../service/app.service';
import { log } from '../../model/log';
import type { BUILD_MODE_ID } from '../../model/builder';
import type { GAME_MODE_ID } from '../../model/consts';
import { environment } from '../../../environments/environment';
import { DialogComponent } from '../dialog/dialog.component';
import { HelpComponent } from '../help/help.component';
import { TilesInfoComponent } from '../tiles-info/tiles-info.component';
import { SettingsComponent } from '../settings/settings.component';
import { ChooseLayoutComponent } from '../choose-layout/choose-layout.component';
import { TranslatePipe } from '@ngx-translate/core';
import { BoardComponent } from '../board/board.component';
import { TutorialComponent } from '../tutorial/tutorial.component';
import { DurationPipe } from '../../pipes/duration.pipe';
import { GameModeEasyPipe, GameModeStandardPipe } from '../../pipes/game-mode.pipe';
import { IconTilesinfoComponent } from '../icons/icon-tilesinfo.component';
import { IconSettingsComponent } from '../icons/icon-settings.component';
import { IconHintComponent } from '../icons/icon-hint.component';
import { IconLogoComponent } from '../icons/icon-logo.component';
import { IconRestartComponent } from '../icons/icon-restart.component';
import { IconMenuComponent } from '../icons/icon-menu.component';
import { IconPauseComponent } from '../icons/icon-pause.component';
import { IconFullscreenComponent } from '../icons/icon-fullscreen.component';
import { IconShuffleComponent } from '../icons/icon-shuffle.component';
import { IconUndoComponent } from '../icons/icon-undo.component';
import { IconMuteComponent } from '../icons/icon-mute.component';

interface DocumentExtended extends Document {
	fullScreen: boolean;
	fullscreen: boolean;
	mozFullScreen: boolean;
	webkitIsFullScreen: boolean;
	mozFullscreenEnabled: boolean;
	webkitFullscreenEnabled: boolean;

	mozCancelFullScreen(): void;

	webkitExitFullscreen(): void;
}

interface HTMLElementExtended extends HTMLElement {
	webkitRequestFullscreen(): void;

	mozRequestFullScreen(): void;
}

function callFullscreenMethod(
	target: Record<string, unknown>,
	methods: ReadonlyArray<string>,
	action: string
): void {
	for (const method of methods) {
		if (typeof target[method] === 'function') {
			try {
				const result = (target[method] as () => unknown)();
				if (result instanceof Promise) {
					result.catch(error => {
						log.warn(`Failed to ${action}:`, error);
					});
				}
			} catch (error) {
				log.warn(`Failed to ${action}:`, error);
			}
			return;
		}
	}
}

@Component({
	selector: 'app-game-component',
	templateUrl: './game-component.component.html',
	styleUrls: ['./game-component.component.scss'],
	host: { '(document:keydown)': 'handleKeyDownEvent($event)' },
	imports: [
		BoardComponent, DurationPipe, GameModeStandardPipe, GameModeEasyPipe,
		HelpComponent, TilesInfoComponent, SettingsComponent, ChooseLayoutComponent, TutorialComponent, TranslatePipe, DialogComponent,
		IconTilesinfoComponent, IconSettingsComponent, IconHintComponent, IconLogoComponent, IconRestartComponent,
		IconMenuComponent, IconPauseComponent, IconFullscreenComponent, IconShuffleComponent, IconUndoComponent, IconMuteComponent
	]
})
export class GameComponent {
	readonly info = viewChild.required<DialogComponent>('info');
	readonly settings = viewChild.required<DialogComponent>('settings');
	readonly help = viewChild.required<DialogComponent>('help');
	readonly newgame = viewChild.required<DialogComponent>('newgame');
	readonly tutorial = viewChild.required<DialogComponent>('tutorial');
	app = inject(AppService);
	game: Game;
	fullScreenEnabled: boolean = true;
	menuOpen: boolean = false;
	title: string = '';
	announceText: string = '';
	private readonly injector = inject(Injector);
	private announceTimer?: ReturnType<typeof setTimeout>;

	constructor() {
		this.game = this.app.game;
		this.fullScreenEnabled = this.canFullscreen();
		this.title = `${this.app.name} v${environment.version}`;
	}

	toggleMenu(): void {
		this.menuOpen = !this.menuOpen;
	}

	closeMenu(): void {
		this.menuOpen = false;
	}

	showTutorial(): void {
		this.tutorial().visible.set(true);
	}

	completeTutorial(): void {
		this.tutorial().visible.set(false);
		this.app.settings.tutorialCompleted = true;
		this.app.settings.save();
		if (this.app.game.isIdle()) {
			this.showNewGame();
		}
	}

	start() {
		if (this.app.settings.tutorialCompleted) {
			this.showNewGame();
		} else {
			this.showTutorial();
		}
	}

	showNewGame(): void {
		this.newgame().visible.set(true);
	}

	handleKeyDownEventKey(key: string): boolean {
		switch (key) {
			case 'h': {
				this.help().toggle();
				break;
			}
			case 'i': {
				this.info().toggle();
				break;
			}
			case 's': {
				this.settings().toggle();
				break;
			}
			case 't': {
				this.game.hint();
				break;
			}
			case 'm': {
				this.game.shuffle();
				break;
			}
			case 'g': {
				this.debugSolve().catch(error => log.error(error));
				break;
			}
			case 'u': {
				this.game.back();
				break;
			}
			case 'n': {
				this.game.pause();
				this.newgame().toggle();
				break;
			}
			case ' ': // space
			case 'space': // space
			case 'Space': // space
			case 'spacebar': // space
			case 'Spacebar': // space
			case 'p': {
				if (this.game.isRunning()) {
					this.game.pause();
				} else if (this.game.isPaused()) {
					this.game.resume();
				}
				break;
			}
			default: {
				return false;
			}
		}
		return true;
	}

	handleKeyDownDialogExit(): boolean {
		const tutorial = this.tutorial();
		if (tutorial.visible()) {
			this.completeTutorial();
			return true;
		}
		const help = this.help();
		if (help.visible()) {
			help.toggle();
			return true;
		}
		const newgame = this.newgame();
		if (newgame.visible()) {
			newgame.toggle();
			return true;
		}
		const info = this.info();
		if (info.visible()) {
			info.toggle();
			return true;
		}
		const settings = this.settings();
		if (settings.visible()) {
			settings.toggle();
			return true;
		}
		if (this.game.message && !this.game.message.askShuffle) {
			this.clickMessage();
			return true;
		}
		return false;
	}

	handleKeyDownEvent(event: KeyboardEvent): void {
		if (event.key === 'Escape' && this.handleKeyDownDialogExit()) {
			return;
		}
		const target = event.target;
		const nodeName = target instanceof Element ? target.nodeName.toLowerCase() : '';
		if (nodeName === 'input' || nodeName === 'button') {
			return;
		}
		if (this.handleKeyDownEventKey(event.key)) {
			event.preventDefault();
		}
	}

	stoneClick(stone?: Stone): void {
		const previousCount = this.game.board.count;
		this.game.click(stone);
		const newCount = this.game.board.count;
		if (newCount < previousCount) {
			const message = this.game.message?.messageID;
			if (message === 'MSG_BEST' || message === 'MSG_GOOD') {
				this.announce(this.app.translate.instant('ANNOUNCE_GAME_WON'));
			} else if (message === 'MSG_FAIL') {
				this.announce(this.app.translate.instant('ANNOUNCE_GAME_LOST'));
			} else {
				this.announce(this.app.translate.instant('ANNOUNCE_MATCHED', { remaining: newCount }));
			}
		}
	}

	onHint(): void {
		this.game.hint();
		const count = this.game.board.hints.groups.length;
		if (count > 0) {
			this.announce(this.app.translate.instant('ANNOUNCE_HINT_PAIRS', { count }));
		} else {
			this.announce(this.app.translate.instant('ANNOUNCE_HINT_NONE'));
		}
	}

	onShuffle(): void {
		this.game.shuffle();
		this.announce(this.app.translate.instant('ANNOUNCE_SHUFFLE'));
	}

	onUndo(): void {
		this.game.back();
		this.announce(this.app.translate.instant('ANNOUNCE_UNDO'));
	}

	private announce(text: string): void {
		this.announceText = '';
		if (this.announceTimer !== undefined) {
			clearTimeout(this.announceTimer);
		}
		this.announceTimer = setTimeout(() => {
			this.announceText = text;
			this.announceTimer = undefined;
		}, 50);
	}

	isFullscreenEnabled(): boolean {
		const doc = window.document as DocumentExtended;
		// Check standard property first
		if (doc.fullscreenEnabled) {
			return true;
		}
		// Check vendor-specific enabled properties
		if (doc.webkitFullscreenEnabled || doc.mozFullscreenEnabled) {
			return true;
		}
		// Fallback: detect support via requestFullscreen on the document element or vendor-prefixed methods
		const element = document.documentElement as HTMLElementExtended;
		return !!(element.requestFullscreen || element.webkitRequestFullscreen || element.mozRequestFullScreen);
	}

	canFullscreen(): boolean {
		if (environment.mobile) {
			return false;
		}
		return this.isFullscreenEnabled();
	}

	isFullscreen(): boolean {
		const doc = window.document as DocumentExtended;
		// Check standard property first, then vendor-specific flags
		return !!(doc.fullscreenElement || doc.webkitIsFullScreen || doc.mozFullScreen || doc.fullScreen);
	}

	exitFullscreen(): void {
		callFullscreenMethod(
			window.document as unknown as Record<string, unknown>,
			['exitFullscreen', 'webkitExitFullscreen', 'mozCancelFullScreen'],
			'exit fullscreen'
		);
	}

	requestFullscreen(): void {
		callFullscreenMethod(
			document.body as unknown as Record<string, unknown>,
			['requestFullscreen', 'webkitRequestFullscreen', 'mozRequestFullScreen'],
			'enter fullscreen'
		);
	}

	enterFullScreen(): void {
		if (this.isFullscreen()) {
			this.exitFullscreen();
		} else {
			this.requestFullscreen();
		}
	}

	newGame(): void {
		this.game.pause();
		this.showNewGame();
	}

	startGame(data: { layout: Layout; buildMode: BUILD_MODE_ID; gameMode: GAME_MODE_ID }): void {
		this.newgame().visible.set(false);
		this.game.reset();
		this.game.start(data.layout, data.buildMode, data.gameMode);
	}

	toggleDialogState(dialogVisible: boolean): void {
		if (dialogVisible) {
			if (!this.app.game.isPaused()) {
				this.app.game.pause();
			}
		} else {
			this.app.settings.save();
			if (this.app.game.isPaused()) {
				this.app.game.resume();
			}
		}
	}

	clickMessage(): void {
		if (this.game.isPaused()) {
			if (this.game.message?.askShuffle) {
				return;
			}
			this.game.resume();
		} else {
			this.game.reset();
			this.showNewGame();
		}
	}

	onShuffleContinue(event: Event): void {
		event.stopPropagation();
		this.game.gameOverEasyModeShuffle();
	}

	onSurrenderGame(event: Event): void {
		event.stopPropagation();
		this.game.surrender();
		this.showNewGame();
	}

	async debugSolve(): Promise<void> {
		if (environment.production) {
			return;
		}
		const { WorkerService } = await import('../../service/worker.service');
		const workerService = this.injector.get(WorkerService);
		const play = (index: number, list: Array<Place>) => {
			const t1 = list[index];
			const t2 = list[index + 1];
			if (!t1 || !t2) {
				return;
			}
			const stones = this.game.board.stones.filter(s => (
				((s.z === t1[0]) && (s.x === t1[1]) && (s.y === t1[2])) ||
				((s.z === t2[0]) && (s.x === t2[1]) && (s.y === t2[2])))
			);
			if (stones.length > 1) {
				for (const stone of stones) {
					stone.selected = true;
				}
				setTimeout(() => {
					this.game.board.pick(stones[0], stones[1]);
					play(index + 2, list);
				}, 300);
			}
		};

		workerService.solveGame(this.game.board.stones.filter(s => !s.picked).map(s => s.toPosition()), data => {
			play(0, data.order);
		});
	}
}
