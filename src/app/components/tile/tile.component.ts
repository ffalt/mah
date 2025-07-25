import { Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';

@Component({
	selector: 'app-tile',
	templateUrl: './tile.component.html',
	styleUrls: ['./tile.component.scss'],
	imports: [ImageSetLoaderComponent, TranslatePipe]
})
export class TileComponent {
	readonly imageSet = input<string>();
	readonly kyodaiUrl = input<string>();
	readonly tile = input.required<string>();
	readonly index = input<number>();
	readonly isDark = input<boolean>(false);
}
