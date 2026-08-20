import { Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { challengeName } from '../../model/challenge/consts';

const LOW_TIME = 30_000;
const TIME_WARNINGS = [10_000, LOW_TIME];

function pad(value: number): string {
	return value < 10 ? `0${value}` : value.toString();
}

function clockLabel(ms: number): string {
	const total = Math.ceil(ms / 1000);
	return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

@Component({
	selector: 'app-challenge-hud',
	templateUrl: './challenge-hud.component.html',
	styleUrls: ['./challenge-hud.component.scss'],
	imports: [TranslatePipe]
})
export class ChallengeHudComponent {
	readonly app = inject(AppService);
	readonly challenge = computed(() => this.app.game.challenge());
	readonly name = computed(() => {
		const challenge = this.challenge();
		return challenge ? challengeName(challenge.id) : '';
	});

	readonly objective = computed(() => this.challenge()?.info.objective);
	readonly progress = computed(() => this.challenge()?.progress());
	readonly subject = computed(() => this.challenge()?.subject());
	readonly score = computed(() => this.challenge()?.score.points() ?? 0);
	readonly multiplier = computed(() => this.challenge()?.score.multiplier ?? 1);
	readonly comboActive = computed(() => (this.challenge()?.score.combo() ?? 0) > 0);
	readonly hasTimeLimit = computed(() => this.challenge()?.hasTimeLimit ?? false);
	readonly remaining = computed(() => Math.max(0, this.challenge()?.remaining() ?? 0));
	readonly lowTime = computed(() => this.hasTimeLimit() && this.remaining() <= LOW_TIME);
	readonly remainingLabel = computed(() => clockLabel(this.remaining()));
	readonly timeWarning = computed(() => {
		if (!this.hasTimeLimit()) {
			return '';
		}
		const remaining = this.remaining();
		const threshold = TIME_WARNINGS.find(limit => remaining > 0 && remaining <= limit);
		return threshold === undefined ? '' : clockLabel(threshold);
	});

	readonly percent = computed(() => {
		const progress = this.progress();
		if (!progress || progress.total <= 0) {
			return 0;
		}
		return Math.min(100, Math.round((progress.current / progress.total) * 100));
	});
}
