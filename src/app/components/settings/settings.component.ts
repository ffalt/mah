import {Component, Input} from '@angular/core';
import {Game} from '../../model/game';
import {Backgrounds, ImageSets} from '../../model/consts';

@Component({
	selector: 'app-settings',
	templateUrl: 'settings.component.html',
	styleUrls: ['settings.component.scss']
})
export class SettingsComponent {

	@Input() public game: Game;

	public sets = ImageSets;
	public backs = Backgrounds;

	constructor() {
	}

}
