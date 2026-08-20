import { Component, inject, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
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
	readonly helpEvent = output<void>();
	readonly shuffleEvent = output<void>();
	readonly undoEvent = output<void>();
	readonly hintEvent = output<void>();
	readonly newGameEvent = output<void>();
	readonly app = inject(AppService);
}
