import { Component, computed, inject, output, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { Board } from '../../model/board';
import { SOUNDS, type Sound } from '../../model/sound';
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
	readonly board = signal<Board>(createTutorialBoard(this.steps[0].board));
	readonly currentStep = computed(() => this.steps[this.currentStepIndex()]);

	readonly app = inject(AppService);
	private readonly sound: Sound;
	private feedbackTimer?: ReturnType<typeof setTimeout>;

	constructor() {
		this.sound = this.app.game.sound;
	}

	onStoneClick(stone?: Stone): void {
		const board = this.board();
		if (!stone) {
			board.clearSelection();
			return;
		}
		if (stone.picked()) {
			return;
		}
		if (stone.state().blocked) {
			this.sound.play(SOUNDS.NOPE);
			this.wiggleStone(stone);
			this.showFeedback('TUTORIAL_FEEDBACK_BLOCKED');
			return;
		}
		if (board.selected && stone !== board.selected) {
			if (stone.groupNr === board.selected.groupNr) {
				board.pick(board.selected, stone);
				this.sound.play(SOUNDS.MATCH);
				if (board.count() === 0) {
					this.onStepComplete();
				}
			} else {
				board.setStoneSelected(stone);
				this.sound.play(SOUNDS.SELECT);
			}
		} else {
			board.setStoneSelected(board.selected === stone ? undefined : stone);
			this.sound.play(SOUNDS.SELECT);
		}
	}

	// Start the tutorial from the welcome page
	start(): void {
		this.currentStepIndex.set(0);
		this.board.set(createTutorialBoard(this.steps[0].board));
	}

	next(): void {
		const nextIndex = this.currentStepIndex() + 1;
		this.currentStepIndex.set(nextIndex);
		if (nextIndex < this.steps.length) {
			this.board.set(createTutorialBoard(this.steps[nextIndex].board));
		}
	}

	skip(): void {
		this.completed.emit();
	}

	private onStepComplete(): void {
		this.sound.play(SOUNDS.WIN);
		setTimeout(() => {
			this.next();
		}, 10);
	}

	private wiggleStone(stone: Stone): void {
		stone.wiggle.set(true);
		setTimeout(() => {
			stone.wiggle.set(false);
		}, 300);
	}

	private showFeedback(key: string): void {
		clearTimeout(this.feedbackTimer);
		this.feedbackKey.set(key);
		this.feedbackTimer = setTimeout(() => {
			this.feedbackKey.set(undefined);
		}, 5000);
	}
}
