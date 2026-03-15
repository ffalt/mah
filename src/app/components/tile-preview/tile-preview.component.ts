import { Component, inject, input } from '@angular/core';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';
import { AppService } from '../../service/app.service';
import { imageSetIsKyodai } from '../../model/tilesets';

@Component({
	selector: 'app-tile-preview',
	templateUrl: './tile-preview.component.html',
	styleUrls: ['./tile-preview.component.scss'],
	imports: [ImageSetLoaderComponent]
})
export class TilePreviewComponent {
	readonly tile = input<string>('t_dr_red');
	readonly app = inject(AppService);

	get isKyodai(): boolean {
		return imageSetIsKyodai(this.app.settings.tileset);
	}

	get imagePos(): Array<number> {
		return this.isKyodai ? [0, 0, 75, 100] : [6, 6, 63, 88];
	}

	get imageCut(): Array<number> {
		return this.isKyodai ? [1, 1, 73, 98] : [0, 0, 65, 90];
	}
}
