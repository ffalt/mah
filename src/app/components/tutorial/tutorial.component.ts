import { Component, inject, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Board } from '../../model/board';
import { SOUNDS, Sound } from '../../model/sound';
import type { Stone } from '../../model/stone';
import { createTutorialBoard, TUTORIAL_STEPS, type TutorialStep } from '../../model/tutorial';
import { AppService } from '../../service/app.service';
import { BoardComponent } from '../board/board.component';

@Component({
	selector: 'app-tutorial',
	templateUrl: './tutorial.component.html',
	styleUrls: ['./tutorial.component.scss'],
	imports: [BoardComponent, TranslatePipe]
})
export class TutorialComponent {
	readonly completed = output();
	readonly currentStepIndex = signal(-1);
	readonly feedbackKey = signal<string | undefined>(undefined);

	readonly steps: ReadonlyArray<TutorialStep> = TUTORIAL_STEPS;
	board: Board;

	readonly app = inject(AppService);
	private readonly sound: Sound;
	private feedbackTimer?: ReturnType<typeof setTimeout>;

	constructor() {
		this.sound = this.app.game.sound;
		this.board = createTutorialBoard(this.steps[0].board);
	}

	get currentStep(): TutorialStep {
		return this.steps[this.currentStepIndex()];
	}

	onStoneClick(stone?: Stone): void {
		if (!stone) {
			this.board.clearSelection();
			return;
		}
		if (stone.picked) {
			return;
		}
		if (stone.state.blocked) {
			this.sound.play(SOUNDS.NOPE);
			this.wiggleStone(stone);
			this.showFeedback('TUTORIAL_FEEDBACK_BLOCKED');
			return;
		}
		if (this.board.selected && stone !== this.board.selected) {
			if (stone.groupNr === this.board.selected.groupNr) {
				this.board.pick(this.board.selected, stone);
				this.sound.play(SOUNDS.MATCH);
				if (this.board.count === 0) {
					this.onStepComplete();
				}
			} else {
				this.board.setStoneSelected(stone);
				this.sound.play(SOUNDS.SELECT);
			}
		} else {
			this.board.setStoneSelected(this.board.selected === stone ? undefined : stone);
			this.sound.play(SOUNDS.SELECT);
		}
	}

	// Start the tutorial from the welcome page
	start(): void {
		this.currentStepIndex.set(0);
		this.board = createTutorialBoard(this.steps[0].board);
	}

	next(): void {
		const nextIndex = this.currentStepIndex() + 1;
		this.currentStepIndex.set(nextIndex);
		if (nextIndex < this.steps.length) {
			this.board = createTutorialBoard(this.steps[nextIndex].board);
		}
	}

	skip(): void {
		this.completed.emit();
	}

	private onStepComplete(): void {
		this.sound.play(SOUNDS.WIN);
		setTimeout(() => {
			this.next();
		}, 800);
	}

	private wiggleStone(stone: Stone): void {
		stone.effects = stone.effects || {};
		stone.effects.wiggle = true;
		setTimeout(() => {
			if (stone.effects) {
				stone.effects.wiggle = false;
			}
		}, 300);
	}

	private showFeedback(key: string): void {
		clearTimeout(this.feedbackTimer);
		this.feedbackKey.set(key);
		this.feedbackTimer = setTimeout(() => {
			this.feedbackKey.set(undefined);
		}, 2000);
	}
}
