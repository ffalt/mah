import {Component, Input} from '@angular/core';
import {TILES_INFO} from '../../model/consts';

@Component({
	selector: 'app-tiles-info',
	templateUrl: './tiles-info.component.html',
	styleUrls: ['./tiles-info.component.scss']
})
export class TilesInfoComponent {
	public info = TILES_INFO;
	@Input()
	public imageSet;

	constructor() {
	}
}
