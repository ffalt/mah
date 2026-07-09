import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ImageSetDefault, ImageSets, TILES_INFOS } from '../../model/consts';
import { AppService } from '../../service/app.service';
import { TileComponent } from '../tile/tile.component';
import { TranslatePipe } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';
import { LicenseLinkComponent } from '../license-link/license-link.component';
import { TilesetDefsComponent } from '../tileset-defs/tileset-defs.component';
import { clickExternalHref } from '../../model/external-links';

@Component({
	selector: 'app-tiles-info',
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './tiles-info.component.html',
	styleUrls: ['./tiles-info.component.scss'],
	imports: [TileComponent, TranslatePipe, LicenseLinkComponent, TilesetDefsComponent]
})
export class TilesInfoComponent {
	TILES_INFOS = TILES_INFOS;
	sets = ImageSets;
	readonly tileset = signal(ImageSetDefault);
	readonly isDark = signal(false);
	canKyodai = environment.kyodai;
	kyodaiUrl?: string;
	readonly app = inject(AppService);

	readonly selectedSet = computed(() => this.sets.find(s => s.id === this.tileset()));

	applyTileset(): void {
		this.app.settings.tileset.set(this.tileset());
		this.app.settings.dark.set(this.isDark());
		this.app.settings.save();
	}

	constructor() {
		this.tileset.set(this.app.settings.tileset());
		this.isDark.set(this.app.settings.dark());
		this.kyodaiUrl = this.app.settings.kyodaiUrl();
	}

	protected readonly clickExternalHref = clickExternalHref;
}
