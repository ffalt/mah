import { computed, signal } from '@angular/core';
import { Board } from './board';
import { Clock } from './clock';
import { GAME_MODE_CHALLENGE, GAME_MODE_EASY, GAME_MODE_EXPERT, type GAME_MODE_ID, GAME_MODE_ID_DEFAULT, RESCUE_SHUFFLE_ATTEMPTS, STATES } from './consts';
import { SOUNDS, Sound } from './sound';
import type { Stone } from './stone';
import type { GameStateStore, Layout, StorageProvider } from './types';
import { type BUILD_MODE_ID, MODE_SOLVABLE } from './builder';
import { Music } from './music';
import { RANDOM_LAYOUT_ID_PREFIX } from './random-layout/consts';
import { Challenge, type ChallengeSetup } from './challenge/challenge';
import { type ChallengeStateStore, challengeFromCode } from './challenge/consts';
import { dailyKey } from './challenge/daily';
import { resetRNG, seedRNG } from './rng';
import { log } from './log';

export interface GameMessage {
	messageID?: string;
	playTime?: number;
	askShuffle?: boolean;
	score?: number;
	scoreBest?: boolean;
}

export interface ChallengeOutcome {
	challenge: Challenge;
	won: boolean;
	playTime: number;
}

export class Game {
	clock: Clock = new Clock();
	board: Board = new Board();
	sound: Sound = new Sound();
	music: Music = new Music();
	readonly state = signal<number>(STATES.idle);
	readonly message = signal<GameMessage | undefined>(undefined);
	onWin?: () => void;
	onChallengeEnd?: (outcome: ChallengeOutcome) => void;
	layoutID?: string = undefined;
	readonly mode = signal<GAME_MODE_ID>(GAME_MODE_ID_DEFAULT);
	readonly challenge = signal<Challenge | undefined>(undefined);
	readonly ruleMode = computed<GAME_MODE_ID>(() => this.challenge() ? GAME_MODE_CHALLENGE : this.mode());
	private saveTimer?: ReturnType<typeof setTimeout>;
	private matchesTimer?: ReturnType<typeof setTimeout>;

	constructor(private readonly storage: StorageProvider) {
		this.clock.onStep = () => this.handleClockStep();
	}

	destroy(): void {
		this.clearSaveTimer();
		this.clearMatchesTimer();
		this.clock.reset();
		this.music.pause();
		this.board.reset();
	}

	init(): void {
		this.load();
		this.board.update();
		if (this.state() === STATES.run) {
			this.pause();
		}
		// without a game to continue there is nothing to message about, the start screen takes over
		this.message.set(this.isPaused() ? { messageID: 'MSG_CONTINUE_SAVE' } : undefined);
	}

	click(stone?: Stone): boolean {
		if (!stone) {
			this.clearMatchesTimer();
			this.board.clearSelection();
			this.board.clearHints();
			return false;
		}
		if (!this.isRunning() || stone.state().blocked) {
			this.sound.play(SOUNDS.NOPE);
			this.wiggleStone(stone);
			this.board.clearHints();
			return true;
		}
		if (this.clock.elapsed() === 0) {
			this.clock.run();
		}
		if (stone && this.board.selected && stone !== this.board.selected && stone.groupNr === this.board.selected.groupNr) {
			this.clearMatchesTimer();
			this.resolveMatchingStone(stone);
			this.board.clearHints();
			return true;
		}
		if (!stone.hinted()) {
			this.board.clearHints();
		}
		this.board.setStoneSelected(this.board.selected === stone ? undefined : stone);
		this.sound.play(SOUNDS.SELECT);
		if (this.board.selected && this.ruleMode() === GAME_MODE_EASY) {
			this.startMatchesHighlight(this.board.selected);
		} else {
			this.clearMatchesTimer();
		}
		return true;
	}

	wiggleStone(stone?: Stone): void {
		if (!stone) {
			return;
		}
		if (stone.wiggleTimer !== undefined) {
			clearTimeout(stone.wiggleTimer);
		}
		stone.wiggle.set(true);
		stone.wiggleTimer = setTimeout(() => {
			stone.wiggle.set(false);
			stone.wiggleTimer = undefined;
		}, 300);
	}

	isRunning(): boolean {
		return this.state() === STATES.run;
	}

	isPaused(): boolean {
		return this.state() === STATES.pause;
	}

	isIdle(): boolean {
		return this.state() === STATES.idle;
	}

	resume(): void {
		this.run();
		this.clock.run();
		this.music.play();
	}

	run(): void {
		this.board.clearHints();
		this.board.update();
		this.setState(STATES.run);
	}

	toggle(): void {
		if (this.state() === STATES.run) {
			this.pause();
		} else if (this.state() === STATES.pause) {
			this.resume();
		}
	}

	pause(): void {
		if (!this.isRunning()) {
			return;
		}
		this.clock.pause();
		this.setState(STATES.pause, 'MSG_CONTINUE_PAUSE');
		this.clearSaveTimer();
		this.save();
		this.music.pause();
	}

	reset(): void {
		this.abandonChallenge();
		this.clearSaveTimer();
		this.clearMatchesTimer();
		this.clock.reset();
		this.setState(STATES.idle);
		this.board.reset();
		this.challenge.set(undefined);
		this.layoutID = undefined;
	}

	start(layout: Layout, buildMode: BUILD_MODE_ID, gameMode: GAME_MODE_ID, challengeSetup?: ChallengeSetup): void {
		this.layoutID = layout.id;
		this.mode.set(gameMode);
		this.buildBoard(layout, buildMode, challengeSetup?.seed);
		this.board.update();
		this.setupChallenge(challengeSetup);
		this.run();
		// a challenge is timed from the moment it starts, not from the first tile the player touches
		if (this.challenge()) {
			this.clock.run();
		}
	}

	hint(): boolean {
		if (!this.allowsHint()) {
			return false;
		}
		if (!this.isRunning()) {
			return false;
		}
		this.board.hint();
		this.challenge()?.hintUsed();
		this.sound.play(SOUNDS.HINT);
		return true;
	}

	shuffle(): boolean {
		if (!this.isRunning()) {
			return false;
		}
		return this.shuffleBoard();
	}

	back(): boolean {
		if (!this.allowsUndo()) {
			return false;
		}
		if (!this.isRunning()) {
			return false;
		}
		this.clearMatchesTimer();
		if (!this.board.back()) {
			return false;
		}
		this.challenge()?.undo();
		this.sound.play(SOUNDS.UNDO);
		return true;
	}

	// overridable so tests can pin the calendar day
	now(): Date {
		return new Date();
	}

	expireStaleDaily(): boolean {
		const store = this.storage.getState();
		if (!store?.challenge || !this.isStaleDaily(store.challenge)) {
			return false;
		}
		this.storage.storeState(undefined);
		const expired = store.challenge;
		const id = challengeFromCode(expired.code);
		if (id) {
			const challenge = new Challenge({ id, seed: expired.seed, dayKey: expired.dayKey }, this.board, this.clock);
			challenge.restore(expired);
			this.finishChallenge(challenge, false, store.elapsed ?? 0);
		}
		this.message.set({ messageID: 'MSG_DAILY_EXPIRED' });
		return true;
	}

	load(): boolean {
		try {
			const store: GameStateStore | undefined = this.storage.getState();
			if (store?.stones?.length) {
				if (this.isStaleDaily(store.challenge)) {
					return false;
				}
				if (!this.board.load(store.stones, store.undo ?? [])) {
					this.discardStoredState();
					return false;
				}
				this.clock.elapsed.set(store.elapsed ?? 0);
				this.layoutID = store.layout;
				this.mode.set(store.gameMode ?? GAME_MODE_ID_DEFAULT);
				this.board.buildMode = store.buildMode ?? MODE_SOLVABLE;
				this.state.set(store.state ?? STATES.idle);
				this.restoreChallenge(store.challenge);
				return true;
			}
		} catch (error) {
			log.error('load state failed', error);
		}
		return false;
	}

	// a save that cannot be restored
	private discardStoredState(): void {
		this.layoutID = undefined;
		this.state.set(STATES.idle);
		try {
			this.storage.storeState();
		} catch (error) {
			log.error('clearing state failed', error);
		}
	}

	save(): void {
		if (!this.layoutID) {
			return;
		}
		try {
			this.storage.storeState({
				elapsed: this.clock.current(),
				state: this.state(),
				layout: this.layoutID,
				gameMode: this.mode(),
				buildMode: this.board.buildMode,
				undo: this.board.undo(),
				stones: this.board.save(),
				challenge: this.challenge()?.save()
			});
		} catch (error) {
			log.error('storing state failed', error);
		}
	}

	gameOverEasyModeShuffle(): void {
		if (!this.allowsShuffle()) {
			this.gameOverLosing();
			return;
		}
		this.sound.play(SOUNDS.SHUFFLE);
		for (let index = 0; index < RESCUE_SHUFFLE_ATTEMPTS; index++) {
			this.board.shuffle();
			if (this.board.free().length > 0) {
				this.resume();
				return;
			}
		}
		// no rescue possible after all attempts, do not re-offer the shuffle prompt
		this.gameOverLosing();
	}

	surrender(): void {
		if (this.challenge()) {
			this.gameOverLosing();
			return;
		}
		this.storeLostGame();
		this.sound.play(SOUNDS.OVER);
		this.gameOver();
	}

	checkGameState(): boolean {
		// a challenge verdict outranks the board rules - Match Attack can win with tiles left over
		const verdict = this.challenge()?.evaluate() ?? 'run';
		if (verdict === 'won') {
			this.gameOverWinning();
			return false;
		}
		if (verdict === 'lost') {
			this.gameOverLosing();
			return false;
		}
		if (this.board.count() < 2) {
			const challenge = this.challenge();
			// an empty board only wins a challenge that asked for one - a match or score target the player
			// never reached cannot be met any more, so the tiles running out ends the run as a loss
			if (challenge && challenge.info.objective !== 'clear') {
				this.gameOverLosing();
				return false;
			}
			this.gameOverWinning();
		} else if (this.board.free().length === 0) {
			if (this.ruleMode() === GAME_MODE_EASY && this.board.countUnblocked() > 1) {
				this.gameOverEasyMode();
				return false;
			}
			this.gameOverLosing();
		} else {
			this.sound.play(SOUNDS.MATCH);
			this.delayedSave();
			return true;
		}
		return false;
	}

	private shuffleBoard(): boolean {
		if (!this.allowsShuffle()) {
			return false;
		}
		if (!this.board.shuffle()) {
			return false;
		}
		this.sound.play(SOUNDS.SHUFFLE);
		return true;
	}

	private clearSaveTimer(): void {
		if (this.saveTimer === undefined) {
			return;
		}

		clearTimeout(this.saveTimer);
		this.saveTimer = undefined;
	}

	private startMatchesHighlight(stone: Stone): void {
		this.clearMatchesTimer();
		this.board.highlightMatches(stone);
		this.matchesTimer = setTimeout(() => {
			this.board.clearMatches();
			this.matchesTimer = undefined;
		}, 700);
	}

	private clearMatchesTimer(): void {
		if (this.matchesTimer !== undefined) {
			clearTimeout(this.matchesTimer);
			this.matchesTimer = undefined;
		}
		this.board.clearMatches();
	}

	// challenge runs are recorded per day, never against the layout's own best time - the rules differ
	private isStorableLayoutId(): boolean {
		return this.layoutID !== undefined && !this.layoutID.startsWith(RANDOM_LAYOUT_ID_PREFIX) && !this.challenge();
	}

	private buildBoard(layout: Layout, buildMode: BUILD_MODE_ID, seed?: string): void {
		if (!seed) {
			this.board.applyMapping(layout.mapping, buildMode);
			return;
		}
		// a challenge board has to come out identical for everyone, so tile assignment runs off the seed
		seedRNG(seed);
		try {
			this.board.applyMapping(layout.mapping, buildMode);
		} finally {
			resetRNG();
		}
	}

	private setupChallenge(setup?: ChallengeSetup): void {
		if (!setup) {
			this.challenge.set(undefined);
			return;
		}
		const challenge = new Challenge(setup, this.board, this.clock);
		challenge.start();
		this.challenge.set(challenge);
	}

	private isStaleDaily(store?: ChallengeStateStore): boolean {
		return !!store?.dayKey && store.dayKey !== dailyKey(this.now());
	}

	private restoreChallenge(store?: ChallengeStateStore): void {
		if (!store) {
			this.challenge.set(undefined);
			return;
		}
		const id = challengeFromCode(store.code);
		if (!id) {
			this.challenge.set(undefined);
			return;
		}
		const challenge = new Challenge({ id, seed: store.seed, dayKey: store.dayKey }, this.board, this.clock);
		challenge.restore(store);
		this.challenge.set(challenge);
	}

	allowsHint(): boolean {
		const challenge = this.challenge();
		return challenge ? challenge.info.allowHint : this.mode() !== GAME_MODE_EXPERT;
	}

	allowsUndo(): boolean {
		const challenge = this.challenge();
		return challenge ? challenge.info.allowUndo : this.mode() !== GAME_MODE_EXPERT;
	}

	allowsShuffle(): boolean {
		return this.ruleMode() === GAME_MODE_EASY;
	}

	private handleClockStep(): void {
		const challenge = this.challenge();
		if (!challenge || !this.isRunning()) {
			return;
		}
		const verdict = challenge.evaluate();
		if (verdict === 'won') {
			this.gameOverWinning();
		} else if (verdict === 'lost') {
			this.gameOverLosing();
		}
	}

	// the earned score would otherwise vanish with the hud, so it rides along on the end message
	private challengeGameOver(challenge: Challenge, messageID: string, playTime: number): void {
		// dropped before gameOver(), whose clock reset would otherwise send the hud countdown back to the full limit
		this.challenge.set(undefined);
		this.gameOver(messageID, playTime);
		this.message.update(message => (message ? { ...message, score: challenge.score.points() } : message));
	}

	private finishChallenge(challenge: Challenge, won: boolean, playTime: number): void {
		this.onChallengeEnd?.({ challenge, won, playTime });
	}

	private abandonChallenge(): void {
		const challenge = this.challenge();
		if (!challenge) {
			return;
		}
		this.finishChallenge(challenge, false, this.clock.elapsed());
	}

	private storeLostGame(): void {
		if (!this.isStorableLayoutId()) {
			return;
		}
		const id = this.layoutID ?? 'unknown';
		const score = this.storage.getScore(id) ?? {};
		score.loseCount = (score.loseCount ?? 0) + 1;
		this.storage.storeScore(id, score);
	}

	private gameOverLosing(): void {
		if (this.challenge()) {
			this.gameOverLosingChallenge();
			return;
		}
		this.storeLostGame();
		this.sound.play(SOUNDS.OVER);
		this.gameOver('MSG_FAIL');
	}

	private gameOverLosingChallenge(): void {
		const challenge = this.challenge();
		if (!challenge) {
			return;
		}
		const playTime = this.clock.elapsed();
		// read the countdown before gameOver() resets the clock
		const timeUp = challenge.hasTimeLimit && challenge.remaining() <= 0;
		this.sound.play(SOUNDS.OVER);
		this.challengeGameOver(challenge, timeUp ? 'MSG_TIME_UP' : 'MSG_CHALLENGE_LOST', playTime);
		this.finishChallenge(challenge, false, playTime);
	}

	private gameOverWinning(): void {
		const playTime = this.clock.elapsed();
		const challenge = this.challenge();
		if (challenge) {
			this.challengeGameOver(challenge, 'MSG_CHALLENGE_WON', playTime);
			this.sound.play(SOUNDS.WIN);
			this.finishChallenge(challenge, true, playTime);
			this.onWin?.();
			return;
		}
		if (!this.isStorableLayoutId()) {
			this.gameOver('MSG_GOOD', playTime);
			this.sound.play(SOUNDS.WIN);
			this.onWin?.();
			return;
		}
		const id = this.layoutID ?? 'unknown';
		const score = this.storage.getScore(id) ?? {};
		score.winCount = (score.winCount ?? 0) + 1;
		score.playTime = (score.playTime ?? 0) + playTime;
		if (!score.bestTime || score.bestTime > playTime) {
			score.bestTime = playTime;
			this.gameOver('MSG_BEST', playTime);
		} else {
			this.gameOver('MSG_GOOD', playTime);
		}
		this.storage.storeScore(id, score);
		this.sound.play(SOUNDS.WIN);
		this.onWin?.();
	}

	private delayedSave(): void {
		this.clearSaveTimer();
		this.saveTimer = setTimeout(() => {
			this.saveTimer = undefined;
			this.save();
		}, 300);
	}

	private gameOverEasyMode() {
		this.clock.pause();
		this.message.set({ messageID: 'MSG_FAIL', askShuffle: true });
		this.state.set(STATES.pause);
		this.delayedSave();
		this.music.pause();
	}

	private resolveMatchingStone(stone: Stone): void {
		const sel = this.board.selected;
		if (!sel) {
			return;
		}
		this.board.pick(sel, stone);
		this.challenge()?.pick(sel, stone);
		this.checkGameState();
	}

	private gameOver(message?: string, playTime?: number): void {
		this.setState(STATES.idle, message, playTime);
		this.clock.reset();
		this.clearSaveTimer();
		this.save();
	}

	private setState(state: number, messageID?: string, playTime?: number): void {
		this.message.set(messageID ? { messageID, playTime } : undefined);
		this.state.set(state);
	}
}
