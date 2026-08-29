import { Component, computed, inject, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { AppService } from '../../service/app.service';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { tileImageCut, tileImagePos } from '../../model/tilesets';

interface StartTile {
	id: string;
	name: string;
	transform: string;
}

@Component({
	selector: 'app-game-start',
	templateUrl: './game-start.component.html',
	styleUrls: ['./game-start.component.scss'],
	imports: [TranslatePipe, ImageSetLoaderComponent]
})
export class GameStartComponent {
	readonly startEvent = output<void>();
	readonly app = inject(AppService);

	readonly tiles: Array<StartTile> = [
		{ id: 't_ba1', name: 'left', transform: 'translate(72 104) rotate(-9) scale(0.84) translate(-37.5 -50)' },
		{ id: 't_do1', name: 'right', transform: 'translate(208 104) rotate(9) scale(0.84) translate(-37.5 -50)' },
		{ id: 't_dr_red', name: 'center', transform: 'translate(140 94) translate(-37.5 -50)' }
	];

	readonly imagePos = computed(() => tileImagePos(this.app.settings.tileset()));
	readonly imageCut = computed(() => tileImageCut(this.app.settings.tileset()));
}
