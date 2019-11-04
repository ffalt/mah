import {Component} from '@angular/core';
import {environment} from '../../../environments/environment';
import {AppService} from '../../service/app.service';

@Component({
	selector: 'app-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss']
})
export class HelpComponent {
	version = environment.version;

	constructor(public app: AppService) {
	}
}
