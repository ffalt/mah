import { Board } from './board';
import { Clock } from './clock';
import { GAME_MODE_EASY, GAME_MODE_EXPERT, type GAME_MODE_ID, GAME_MODE_STANDARD, STATES } from './consts';
import { SOUNDS, Sound } from './sound';
import type { Stone } from './stone';
import type { GameStateStore, Layout, StorageProvider } from './types';
import type { BUILD_MODE_ID } from './builder';
import { Music } from './music';

export class Game {
	clock: Clock = new Clock();
	board: Board = new Board();
	sound: Sound = new Sound();
	music: Music = new Music();
	state: number = STATES.idle;
	message?: { messageID?: string; playTime?: number };
	layoutID?: string = undefined;
	mode: GAME_MODE_ID = GAME_MODE_STANDARD;

	constructor(private readonly storage: StorageProvider) {
	}

	init(): void {
		this.load();
		this.board.update();
		if (this.state === STATES.run) {
			this.pause();
		}
		this.message = { messageID: this.isPaused() ? 'MSG_CONTINUE_SAVE' : 'MSG_START' };
	}

	click(stone?: Stone): boolean {
		if (!stone) {
			this.board.clearSelection();
			return false;
		}
		if (!this.isRunning() || stone.state.blocked) {
			this.sound.play(SOUNDS.NOPE);
			return true;
		}
		if (this.clock.elapsed === 0) {
			this.clock.run();
		}
		if (this.board.selected && stone && stone !== this.board.selected && stone.groupNr === this.board.selected.groupNr) {
			this.resolveMatchingStone(stone);
			return true;
		}
		this.board.setStoneSelected(this.board.selected === stone ? undefined : stone);
		this.sound.play(SOUNDS.SELECT);
		return true;
	}

	isRunning(): boolean {
		return this.state === STATES.run;
	}

	isPaused(): boolean {
		return this.state === STATES.pause;
	}

	isIdle(): boolean {
		return this.state === STATES.idle;
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
		if (this.state === STATES.run) {
			this.pause();
		} else if (this.state === STATES.pause) {
			this.resume();
		}
	}

	pause(): void {
		this.clock.pause();
		this.setState(STATES.pause, 'MSG_CONTINUE_PAUSE');
		this.save();
		this.music.pause();
	}

	reset(): void {
		this.clock.reset();
		this.setState(STATES.idle);
		this.board.reset();
	}

	start(layout: Layout, buildMode: BUILD_MODE_ID, gameMode: GAME_MODE_ID): void {
		this.layoutID = layout.id;
		this.mode = gameMode;
		this.board.applyMapping(layout.mapping, buildMode);
		this.board.update();
		this.run();
	}

	hint(): void {
		if (this.mode === GAME_MODE_EXPERT) {
			return;
		}
		this.board.hint();
	}

	shuffle(): void {
		if (this.mode !== GAME_MODE_EASY) {
			return;
		}
		this.board.shuffle();
	}

	back(): void {
		if (this.mode === GAME_MODE_EXPERT) {
			return;
		}
		if (!this.isRunning()) {
			return;
		}
		this.board.back();
	}

	load(): boolean {
		try {
			const store: GameStateStore | undefined = this.storage.getState();
			if (store?.stones) {
				this.clock.elapsed = store.elapsed ?? 0;
				this.layoutID = store.layout;
				this.mode = store.gameMode ?? GAME_MODE_STANDARD;
				this.state = store.state ?? STATES.idle;
				this.board.load(store.stones, store.undo ?? []);
				return true;
			}
		} catch (error) {
			console.error('load state failed', error);
		}
		return false;
	}

	save(): void {
		try {
			this.storage.storeState({
				elapsed: this.clock.elapsed,
				state: this.state,
				layout: this.layoutID ?? '',
				gameMode: this.mode,
				undo: this.board.undo,
				stones: this.board.save()
			});
		} catch (error) {
			console.error('storing state failed', error);
		}
	}

	private gameOverLoosing(): void {
		const id = this.layoutID ?? 'unknown';
		const score = this.storage.getScore(id) ?? {};
		score.playCount = (score.playCount ?? 0) + 1;
		this.storage.storeScore(id, score);
		this.gameOver('MSG_FAIL');
	}

	private gameOverWining(): void {
		const id = this.layoutID ?? 'unknown';
		const playTime = this.clock.elapsed;
		const score = this.storage.getScore(id) ?? {};
		score.playCount = (score.playCount ?? 0) + 1;
		if (!score.bestTime || score.bestTime > playTime) {
			score.bestTime = playTime;
			this.gameOver('MSG_BEST', playTime);
		} else {
			this.gameOver('MSG_GOOD', playTime);
		}
		this.storage.storeScore(id, score);
	}

	private delayedSave(): void {
		setTimeout(() => {
			this.save();
		}, 500);
	}

	private resolveMatchingStone(stone: Stone): void {
		const sel = this.board.selected;
		if (!sel) {
			return;
		}
		this.board.pick(sel, stone);
		if (this.board.count < 2) {
			this.gameOverWining();
		} else if (this.board.free.length === 0) {
			this.gameOverLoosing();
		} else {
			this.sound.play(SOUNDS.MATCH);
			this.delayedSave();
		}
	}

	private gameOver(message: string, playTime?: number): void {
		this.sound.play(SOUNDS.OVER);
		this.setState(STATES.idle, message, playTime);
		this.clock.reset();
		this.delayedSave();
	}

	private setState(state: number, messageID?: string, playTime?: number): void {
		this.message = messageID ? { messageID, playTime } : undefined;
		this.state = state;
	}
}
