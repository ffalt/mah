import { Component, computed, input } from '@angular/core';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { ImageSetDefault } from '../../model/consts';
import { isKyodaiImageSet } from '../../model/tilesets';

@Component({
	selector: 'app-tile-preview',
	templateUrl: './tile-preview.component.html',
	styleUrls: ['./tile-preview.component.scss'],
	imports: [ImageSetLoaderComponent]
})
export class TilePreviewComponent {
	readonly tile = input<string>('t_dr_red');
	readonly tileset = input<string>(ImageSetDefault);
	readonly kyodaiUrl = input<string>();
	readonly dark = input<boolean>(false);
	readonly contrast = input<boolean>(false);
	readonly tile3d = input<boolean>(false);

	readonly isKyodai = computed(() => isKyodaiImageSet(this.tileset()));
	readonly imagePos = computed(() => this.isKyodai() ? [0, 0, 75, 100] : [6, 6, 63, 88]);
	readonly imageCut = computed(() => this.isKyodai() ? [1, 1, 73, 98] : [0, 0, 65, 90]);
}
