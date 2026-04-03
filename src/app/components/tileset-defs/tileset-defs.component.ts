import { Component, input } from '@angular/core';
import { ImageSetLoaderComponent } from '../image-set-loader/image-set-loader.component';

@Component({
	selector: 'app-tileset-defs',
	templateUrl: './tileset-defs.component.html',
	styles: ':host { position: absolute; width: 0; height: 0; overflow: hidden; }',
	imports: [ImageSetLoaderComponent]
})
export class TilesetDefsComponent {
	readonly imageSet = input<string>();
	readonly kyodaiUrl = input<string>();
	readonly isDark = input<boolean>(false);
	readonly prefix = input('shared_');
}
