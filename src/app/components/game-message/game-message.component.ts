import { Component, inject, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { DialogComponent } from '../dialog/dialog.component';
import { DurationPipe } from '../../pipes/duration.pipe';
import { IconShuffleComponent } from '../icons/icon-shuffle.component';
import { IconRestartComponent } from '../icons/icon-restart.component';

@Component({
	selector: 'app-game-message',
	templateUrl: './game-message.component.html',
	imports: [DialogComponent, TranslatePipe, DurationPipe, IconShuffleComponent, IconRestartComponent]
})
export class GameMessageComponent {
	readonly messageEvent = output<Event | undefined>();
	readonly shuffleEvent = output<Event>();
	readonly surrenderEvent = output<Event>();
	readonly app = inject(AppService);
}
