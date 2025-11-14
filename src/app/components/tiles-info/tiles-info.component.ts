import { Component, inject } from '@angular/core';
import { ImageSetDefault, ImageSets, TILES_INFOS } from '../../model/consts';
import { AppService } from '../../service/app.service';
import { TileComponent } from '../tile/tile.component';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { LicenseLinkComponent } from '../license-link/license-link.component';

@Component({
	selector: 'app-tiles-info',
	templateUrl: './tiles-info.component.html',
	styleUrls: ['./tiles-info.component.scss'],
	imports: [TileComponent, TranslatePipe, LicenseLinkComponent]
})
export class TilesInfoComponent {
	TILES_INFOS = TILES_INFOS;
	sets = ImageSets;
	tileset = ImageSetDefault;
	isDark = false;
	canKyodai = environment.kyodai;
	kyodaiUrl?: string;
	app = inject(AppService);

	get selectedSet() {
		return this.sets.find(s => s.id === this.tileset);
	}

	applyTileset(): void {
		this.app.settings.tileset = this.tileset;
		this.app.settings.dark = this.isDark;
		this.app.settings.save();
	}

	constructor() {
		this.tileset = this.app.settings.tileset;
		this.isDark = this.app.settings.dark;
		this.kyodaiUrl = this.app.settings.kyodaiUrl;
	}
}
