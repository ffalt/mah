import {Component} from '@angular/core';
import {ImageSetDefault, ImageSets, TILES_INFOS} from '../../model/consts';
import {AppService} from '../../service/app.service';

@Component({
    selector: 'app-tiles-info',
    templateUrl: './tiles-info.component.html',
    styleUrls: ['./tiles-info.component.scss'],
    standalone: false
})
export class TilesInfoComponent {
	TILES_INFOS = TILES_INFOS;
	sets = ImageSets;
	tileset = ImageSetDefault;
	isDark = false;
	kyodaiUrl?: string;

	constructor(app: AppService) {
		this.tileset = app.settings.tileset;
		this.isDark = app.settings.dark;
		this.kyodaiUrl = app.settings.kyodaiUrl;
	}
}
