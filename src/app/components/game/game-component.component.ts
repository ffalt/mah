import { Component, computed, inject, Injector, signal, viewChild } from '@angular/core';
import type { Game } from '../../model/game';
import type { Stone } from '../../model/stone';
import type { Layout, Place } from '../../model/types';
import { AppService } from '../../service/app.service';
import { log } from '../../model/log';
import { isFormControlTarget, isNativeButtonKey } from '../../model/dom-utilities';
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
import { ControlsTopComponent } from '../controls-top/controls-top.component';
import { ControlsBottomComponent } from '../controls-bottom/controls-bottom.component';
import { ZenControlsComponent } from '../zen-controls/zen-controls.component';
import { GameMessageComponent } from '../game-message/game-message.component';
import { GameStartComponent } from '../game-start/game-start.component';
import { Confetti } from '../../model/confetti';

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
		if (typeof target[method] !== 'function') {
			continue;
		}

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

@Component({
	selector: 'app-game-component',
	templateUrl: './game-component.component.html',
	styleUrls: ['./game-component.component.scss'],
	host: {
		'[class.zen-mode]': 'zenMode()'
	},
	imports: [
		BoardComponent, ControlsTopComponent, ControlsBottomComponent, ZenControlsComponent, GameMessageComponent, GameStartComponent, TranslatePipe,

		HelpComponent, TilesInfoComponent, SettingsComponent, ChooseLayoutComponent, TutorialComponent, DialogComponent
	]
})
export class GameComponent {
	readonly info = viewChild.required<DialogComponent>('info');
	readonly settings = viewChild.required<DialogComponent>('settings');
	readonly help = viewChild.required<DialogComponent>('help');
	readonly newgame = viewChild.required<DialogComponent>('newgame');
	readonly tutorial = viewChild.required<DialogComponent>('tutorial');
	readonly app = inject(AppService);
	game: Game;
	fullScreenEnabled: boolean = true;
	title: string = '';
	readonly zenMode = signal(false);
	readonly announceText = signal('');
	readonly anyDialogVisible = signal(false);
	readonly showStartScreen = computed(() => this.game.isIdle() && !this.game.message() && !this.anyDialogVisible());

	private readonly injector = inject(Injector);
	private announceTimer?: ReturnType<typeof setTimeout>;

	constructor() {
		this.game = this.app.game;
		this.game.onWin = () => this.triggerConfetti();
		this.fullScreenEnabled = this.canFullscreen();
		this.title = `${this.app.name} v${environment.version}`;
	}

	triggerConfetti(): void {
		if (!this.app.settings.confetti()) {
			return;
		}
		const confetti = new Confetti();
		confetti.trigger();
	}

	toggleZenMode(): void {
		this.zenMode.update(zen => !zen);
	}

	exitZenMode(): void {
		this.zenMode.set(false);
	}

	showTutorial(): void {
		this.tutorial().open();
	}

	completeTutorial(): void {
		this.tutorial().close();
		this.app.settings.tutorialCompleted.set(true);
		this.app.settings.save();
		if (this.app.game.isIdle()) {
			this.showNewGame();
		}
	}

	start() {
		if (this.app.settings.tutorialCompleted()) {
			this.showNewGame();
		} else {
			this.showTutorial();
		}
	}

	showNewGame(): void {
		this.newgame().open();
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
		const message = this.game.message();
		if (message && !message.askShuffle) {
			this.clickMessage();
			return true;
		}
		return false;
	}

	isDialogVisible(): boolean {
		return this.tutorial().visible() || this.help().visible() || this.newgame().visible() || this.info().visible() || this.settings().visible();
	}

	handleKeyDownEvent(event: KeyboardEvent): void {
		if (event.key === 'Escape' && this.handleKeyDownDialogExit()) {
			return;
		}
		if (isFormControlTarget(event.target) || isNativeButtonKey(event.target, event.key)) {
			return;
		}
		if (this.isDialogVisible() && !this.isDialogCloseKey(event.key)) {
			return;
		}
		if (this.handleKeyDownEventKey(event.key)) {
			event.preventDefault();
		}
	}

	stoneClick(stone?: Stone): void {
		const previousCount = this.game.board.count();
		this.game.click(stone);
		const newCount = this.game.board.count();
		if (newCount < previousCount) {
			const message = this.game.message()?.messageID;
			if (message === 'MSG_BEST' || message === 'MSG_GOOD') {
				this.announce(this.app.translate.instant('ANNOUNCE_GAME_WON'));
			} else if (message === 'MSG_FAIL') {
				this.announce(this.app.translate.instant('ANNOUNCE_GAME_LOST'));
			} else {
				this.announceCount('ANNOUNCE_MATCHED', newCount, { remaining: newCount });
			}
		}
	}

	onHint(): void {
		this.game.hint();
		const count = this.game.board.hints.groups.length;
		if (count > 0) {
			this.announceCount('ANNOUNCE_HINT_PAIRS', count, { count });
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

	private isDialogCloseKey(key: string): boolean {
		const dialog = { h: this.help(), i: this.info(), s: this.settings() }[key];
		return !!dialog?.visible();
	}

	// Languages differ in how many plural forms they need, so the CLDR category picks the key suffix; missing variants fall back to the base key
	private announceCount(key: string, count: number, parameters: Record<string, number>): void {
		const category = new Intl.PluralRules(this.app.translate.getCurrentLang() ?? 'en').select(count);
		const variant = `${key}_${category.toUpperCase()}`;
		const text = this.app.translate.instant(variant, parameters);
		this.announce(text === variant ? this.app.translate.instant(key, parameters) : text);
	}

	private announce(text: string): void {
		this.announceText.set('');
		if (this.announceTimer !== undefined) {
			clearTimeout(this.announceTimer);
		}
		this.announceTimer = setTimeout(() => {
			this.announceText.set(text);
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
		this.anyDialogVisible.set(false);
		this.game.reset();
		this.game.start(data.layout, data.buildMode, data.gameMode);
	}

	toggleDialogState(dialogVisible: boolean): void {
		// the dialog view children cannot be read while the template renders, so mirror their state into a signal
		this.anyDialogVisible.set(this.isDialogVisible());
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

	clickMessage(event?: Event): void {
		if (event) {
			event.stopPropagation();
			event.preventDefault();
		}
		if (this.game.isPaused()) {
			if (this.game.message()?.askShuffle) {
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
			const stones = this.game.board.stones().filter(s => (
				((s.z === t1[0]) && (s.x === t1[1]) && (s.y === t1[2])) ||
				((s.z === t2[0]) && (s.x === t2[1]) && (s.y === t2[2])))
			);
			if (stones.length > 1) {
				for (const stone of stones) {
					stone.selected.set(true);
				}
				setTimeout(() => {
					this.game.board.pick(stones[0], stones[1]);
					play(index + 2, list);
				}, 300);
			}
		};

		workerService.solveGame(this.game.board.stones().filter(s => !s.picked()).map(s => s.toPosition()), data => {
			play(0, data.order);
		});
	}
}
