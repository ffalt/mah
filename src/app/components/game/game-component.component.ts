import { Component, computed, effect, inject, Injector, signal, viewChild } from '@angular/core';
import type { Game } from '../../model/game';
import type { Stone } from '../../model/stone';
import type { Layout, Place } from '../../model/types';
import { AppService } from '../../service/app.service';
import { log } from '../../model/log';
import { isFormControlTarget, isNativeButtonKey } from '../../model/dom-utilities';
import { type BUILD_MODE_ID, MODE_SOLVABLE } from '../../model/builder';
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
import { ChallengeHudComponent } from '../challenge-hud/challenge-hud.component';
import { DailyChallengeComponent } from '../daily-challenge/daily-challenge.component';
import { DailyService, type DailyEntry } from '../../service/daily.service';
import { CHALLENGE_CODES, challengeName } from '../../model/challenge/consts';

const END_ANNOUNCEMENTS: Record<string, string> = {
	MSG_BEST: 'ANNOUNCE_GAME_WON',
	MSG_GOOD: 'ANNOUNCE_GAME_WON',
	MSG_FAIL: 'ANNOUNCE_GAME_LOST',
	MSG_CHALLENGE_WON: 'MSG_CHALLENGE_WON',
	MSG_CHALLENGE_LOST: 'MSG_CHALLENGE_LOST',
	MSG_TIME_UP: 'MSG_TIME_UP'
};

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

		HelpComponent, TilesInfoComponent, SettingsComponent, ChooseLayoutComponent, TutorialComponent, DialogComponent,
		ChallengeHudComponent, DailyChallengeComponent
	]
})
export class GameComponent {
	readonly info = viewChild.required<DialogComponent>('info');
	readonly settings = viewChild.required<DialogComponent>('settings');
	readonly help = viewChild.required<DialogComponent>('help');
	readonly newgame = viewChild.required<DialogComponent>('newgame');
	readonly tutorial = viewChild.required<DialogComponent>('tutorial');
	readonly app = inject(AppService);
	readonly dailyService = inject(DailyService);
	readonly dailyEnabled = environment.daily;
	game: Game;
	fullScreenEnabled: boolean = true;
	title: string = '';
	readonly zenMode = signal(false);
	readonly announceText = signal('');
	readonly anyDialogVisible = signal(false);
	readonly showStartScreen = computed(() => this.game.isIdle() && !this.game.message() && !this.anyDialogVisible());
	readonly dailyView = signal(false);
	readonly dailyUnplayed = computed(() => this.dailyEnabled && !this.dailyService.todayResult());
	readonly blackout = computed(() => this.game.challenge()?.id === CHALLENGE_CODES.CHALLENGE_BLACKOUT);
	readonly concealed = computed(() => this.game.isPaused() && (this.game.challenge()?.hasTimeLimit ?? false));
	readonly pickerGameMode = signal<GAME_MODE_ID>(this.app.game.mode());
	readonly pickerBuildMode = signal<BUILD_MODE_ID>(this.app.game.board.buildMode);
	private readonly injector = inject(Injector);
	private announceTimer?: ReturnType<typeof setTimeout>;

	constructor() {
		this.game = this.app.game;
		this.game.onWin = () => this.triggerConfetti();
		this.game.onChallengeEnd = outcome => {
			const challenge = outcome.challenge;
			if (!challenge.dayKey) {
				return;
			}
			const best = this.dailyService.record(challenge.dayKey, challenge.id, outcome.won, outcome.playTime, challenge.score.points());
			if (best) {
				this.game.message.update(message => (message ? { ...message, scoreBest: true } : message));
			}
		};
		this.game.expireStaleDaily();
		this.fullScreenEnabled = this.canFullscreen();
		this.title = `${this.app.name} v${environment.version}`;
		effect(() => {
			const messageID = this.game.message()?.messageID;
			const announcement = messageID ? END_ANNOUNCEMENTS[messageID] : undefined;
			if (announcement) {
				this.announce(this.app.translate.instant(announcement));
			}
		});
	}

	triggerConfetti(): void {
		if (!this.app.settings.confetti() || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
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
		this.dailyView.set(false);
		this.syncDailyState();
		this.newgame().open();
	}

	showDailyChallenge(): void {
		if (!this.dailyEnabled) {
			return;
		}
		this.dailyView.set(true);
		this.syncDailyState();
		this.newgame().open();
	}

	showLayoutList(): void {
		this.dailyView.set(false);
	}

	onNewGameDialogToggle(dialogVisible: boolean): void {
		if (!dialogVisible) {
			this.dailyView.set(false);
		}
		this.toggleDialogState(dialogVisible);
	}

	startDailyChallenge(entry: DailyEntry): void {
		this.closeNewGameDialog();
		this.dailyView.set(false);
		this.game.reset();
		this.game.start(entry.layout, MODE_SOLVABLE, this.pickerGameMode(), {
			id: entry.challenge,
			seed: entry.seed,
			dayKey: entry.dayKey
		});
		const name = this.app.translate.instant(challengeName(entry.challenge));
		this.announce(this.app.translate.instant('ANNOUNCE_CHALLENGE_STARTED', { name }));
	}

	private syncDailyState(): void {
		if (this.dailyEnabled) {
			this.dailyService.loadTodayResult();
		}
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
			case 'd': {
				if (!this.dailyEnabled) {
					return false;
				}
				this.game.pause();
				this.showDailyChallenge();
				break;
			}
			case ' ': // space
			case 'space': // space
			case 'Space': // space
			case 'spacebar': // space
			case 'Spacebar': // space
			case 'p': {
				this.game.toggle();
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
			// escape steps back to the layout list first, and only then closes the dialog
			if (this.dailyView()) {
				this.showLayoutList();
			} else {
				newgame.toggle();
			}
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
		if (newCount < previousCount && !this.game.message()) {
			this.announceCount('ANNOUNCE_MATCHED', newCount, { remaining: newCount });
		}
	}

	onHint(): void {
		if (!this.game.hint()) {
			return;
		}
		const count = this.game.board.hints.groups.length;
		if (count > 0) {
			this.announceCount('ANNOUNCE_HINT_PAIRS', count, { count });
		} else {
			this.announce(this.app.translate.instant('ANNOUNCE_HINT_NONE'));
		}
	}

	onShuffle(): void {
		if (this.game.shuffle() && !this.game.message()) {
			this.announce(this.app.translate.instant('ANNOUNCE_SHUFFLE'));
		}
	}

	onUndo(): void {
		if (this.game.back()) {
			this.announce(this.app.translate.instant('ANNOUNCE_UNDO'));
		}
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
		this.closeNewGameDialog();
		this.pickerGameMode.set(data.gameMode);
		this.pickerBuildMode.set(data.buildMode);
		this.game.reset();
		this.game.start(data.layout, data.buildMode, data.gameMode);
	}

	private closeNewGameDialog(): void {
		this.newgame().visible.set(false);
		this.anyDialogVisible.set(false);
	}

	toggleDialogState(dialogVisible: boolean): void {
		this.anyDialogVisible.set(this.isDialogVisible());
		if (dialogVisible) {
			this.game.pause();
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
					this.game.challenge()?.pick(stones[0], stones[1]);
					for (const stone of stones) {
						stone.selected.set(false);
					}
					this.game.checkGameState();
					play(index + 2, list);
				}, 300);
			}
		};

		workerService.solveGame(this.game.board.stones().filter(s => !s.picked()).map(s => s.toPosition()), data => {
			play(0, data.order);
		});
	}
}
