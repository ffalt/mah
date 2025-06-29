import { Component, input } from '@angular/core';

@Component({
	selector: 'app-tile',
	templateUrl: './tile.component.html',
	styleUrls: ['./tile.component.scss'],
	standalone: false
})
export class TileComponent {
	readonly imageSet = input<string>();
	readonly kyodaiUrl = input<string>();
	readonly tile = input.required<string>();
	readonly index = input<number>();
	readonly isDark = input<boolean>(false);
}
