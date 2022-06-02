import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

@Component({
	selector: 'app-tile',
	templateUrl: './tile.component.html',
	styleUrls: ['./tile.component.scss']
})
export class TileComponent implements OnChanges {
	@Input() imageSet: string;
	@Input() tile: string;
	@Input() index: number;
	isDark: boolean = false;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.imageSet) {
			this.isDark = (changes.imageSet.currentValue || '').endsWith('-black');
		}
	}
}
