import { Component, Input } from '@angular/core';

@Component({
	selector: 'app-tile',
	templateUrl: './tile.component.html',
	styleUrls: ['./tile.component.scss'],
	standalone: false
})
export class TileComponent {
	@Input() imageSet: string;
	@Input() kyodaiUrl?: string;
	@Input() tile: string;
	@Input() index: number;
	@Input() isDark: boolean = false;
}
