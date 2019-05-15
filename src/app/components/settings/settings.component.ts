import {Component, Input} from '@angular/core';
import {Backgrounds, ImageSets} from '../../model/consts';
import {Game} from '../../model/game';

@Component({
	selector: 'app-settings',
	templateUrl: 'settings.component.html',
	styleUrls: ['settings.component.scss']
})
export class SettingsComponent {
	@Input() game: Game;
	sets = ImageSets;
	backs = Backgrounds;
}
