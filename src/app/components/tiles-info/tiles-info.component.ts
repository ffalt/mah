import { Component, inject } from '@angular/core';
import { ImageSetDefault, ImageSets, TILES_INFOS } from '../../model/consts';
import { AppService } from '../../service/app.service';
import { TileComponent } from '../tile/tile.component';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

@Component({
	selector: 'app-tiles-info',
	templateUrl: './tiles-info.component.html',
	styleUrls: ['./tiles-info.component.scss'],
	imports: [TileComponent, TranslatePipe]
})
export class TilesInfoComponent {
	TILES_INFOS = TILES_INFOS;
	sets = ImageSets;
	tileset = ImageSetDefault;
	isDark = false;
	canKyodai = environment.kyodai;
	kyodaiUrl?: string;

	constructor() {
		const app = inject(AppService);
		this.tileset = app.settings.tileset;
		this.isDark = app.settings.dark;
		this.kyodaiUrl = app.settings.kyodaiUrl;
	}
}
