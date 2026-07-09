import { Component, computed, inject, input } from '@angular/core';
import type { Draw } from '../../model/draw';
import { AppService } from '../../service/app.service';
import { PrefixPipe } from '../../pipes/prefix.pipe';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
	selector: 'g[app-board-tile]',
	templateUrl: './board-tile.component.html',
	host: {
		'[class.selected]': 'draw().source.selected()',
		'[class.hidden]': 'draw().source.picked()',
		'[class.hinted]': 'draw().source.hinted()',
		'[class.matched]': 'draw().source.matched()',
		'[class.wiggle]': 'draw().source.wiggle()',
		'[attr.transform]': 'draw().pos.translate',
		'[attr.role]': 'interactive() ? \'button\' : null',
		'[attr.tabindex]': 'interactive() ? 0 : null',
		'[attr.aria-label]': 'interactive() ? tileLabel() : null',
		'[attr.aria-pressed]': 'interactive() ? draw().source.selected() : null'
	},
	imports: [PrefixPipe, TranslatePipe]
})
export class BoardTileComponent {
	readonly draw = input.required<Draw>();
	readonly imagePos = input.required<Array<number>>();
	readonly urlPrefix = input.required<string>();
	readonly interactive = computed(() => !this.draw().source.picked() && !this.draw().source.state().blocked);
	readonly app = inject(AppService);
	readonly tileLabel = computed(() => {
		this.app.lang(); // translate.instant is not reactive, recompute when the loaded language changes
		const draw = this.draw();
		const name = draw.url ? this.app.translate.instant(draw.url) : '';
		const layer = draw.source.z + 1;
		const key = draw.source.hinted() ? 'TILE_LABEL_HINTED' : 'TILE_LABEL';
		return this.app.translate.instant(key, { name, layer });
	});
}
