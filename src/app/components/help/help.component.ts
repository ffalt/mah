import {Component} from '@angular/core';
import {environment} from '../../../environments/environment';
import {AppService} from '../../service/app.service';
import {ImageSets} from '../../model/consts';

@Component({
	selector: 'app-help',
	templateUrl: './help.component.html',
	styleUrls: ['./help.component.scss']
})
export class HelpComponent {
	version = environment.version;
	sets = ImageSets;
	constructor(public app: AppService) {
	}
}
