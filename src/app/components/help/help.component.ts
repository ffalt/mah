import {Component, Input} from '@angular/core';
import {Game} from '../../model/game';
import {environment} from '../../../environments/environment';

@Component({
	selector: 'app-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss']
})
export class HelpComponent {

	@Input() public game: Game;
	public version = environment.version;

	constructor() {
	}
}
