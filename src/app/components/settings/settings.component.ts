import {Component} from '@angular/core';
import {Backgrounds, ImageSets} from '../../model/consts';
import {AppService} from '../../service/app.service';

@Component({
	selector: 'app-settings',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.scss']
})
export class SettingsComponent {
	sets = ImageSets;
	backs = Backgrounds;

	constructor(public app: AppService) {
	}

}
