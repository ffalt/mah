import {Component, Input} from '@angular/core';
import {environment} from '../../../environments/environment';
import {Game} from '../../model/game';

@Component({
	selector: 'app-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss']
})
export class HelpComponent {
	@Input() game: Game;
	version = environment.version;
}
