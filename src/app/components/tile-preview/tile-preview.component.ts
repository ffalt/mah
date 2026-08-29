import { Component, computed, input } from '@angular/core';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { ImageSetDefault } from '../../model/consts';
import type { StoneMark } from '../../model/challenge/consts';
import { tileImageCut, tileImagePos } from '../../model/tilesets';

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
	readonly shadows = input<boolean>(true);
	readonly animations = input<boolean>(true);
	readonly mark = input<StoneMark>();

	readonly imagePos = computed(() => tileImagePos(this.tileset()));
	readonly imageCut = computed(() => tileImageCut(this.tileset()));
}
