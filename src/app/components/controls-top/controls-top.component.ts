import { Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { GAME_MODE_EASY, type GAME_MODE_ID, GAME_MODE_STANDARD } from '../../model/consts';
import { IconLogoComponent } from '../icons/icon-logo.component';
import { IconPauseComponent } from '../icons/icon-pause.component';
import { IconShuffleComponent } from '../icons/icon-shuffle.component';
import { IconUndoComponent } from '../icons/icon-undo.component';
import { IconHintComponent } from '../icons/icon-hint.component';
import { IconRestartComponent } from '../icons/icon-restart.component';

@Component({
	selector: 'app-controls-top',
	templateUrl: './controls-top.component.html',
	styleUrls: ['./controls-top.component.scss'],
	imports: [TranslatePipe, IconLogoComponent, IconPauseComponent, IconShuffleComponent, IconUndoComponent, IconHintComponent, IconRestartComponent]
})
export class ControlsTopComponent {
	readonly gameMode = input.required<GAME_MODE_ID>();
	readonly helpEvent = output<void>();
	readonly shuffleEvent = output<void>();
	readonly undoEvent = output<void>();
	readonly hintEvent = output<void>();
	readonly newGameEvent = output<void>();
	readonly app = inject(AppService);
	readonly gameModeEasy = computed(() => this.gameMode() === GAME_MODE_EASY);
	readonly gameModeStandard = computed(() => [GAME_MODE_EASY, GAME_MODE_STANDARD].includes(this.gameMode()));
}
