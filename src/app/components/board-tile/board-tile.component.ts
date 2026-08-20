import { Component, computed, inject, input } from '@angular/core';
import type { Draw } from '../../model/draw';
import { MARK_LABELS } from '../../model/challenge/consts';
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
		'[attr.data-mark]': 'mark() ?? null',
		'[attr.data-draw-key]': 'draw().key',
		'[attr.transform]': 'draw().pos.translate',
		'[attr.role]': 'interactive() ? \'button\' : (announced() ? \'img\' : null)',
		'[attr.tabindex]': 'announced() ? 0 : null',
		'[attr.aria-label]': 'announced() ? tileLabel() : null',
		'[attr.aria-pressed]': 'interactive() ? draw().source.selected() : null'
	},
	imports: [PrefixPipe, TranslatePipe]
})
export class BoardTileComponent {
	readonly draw = input.required<Draw>();
	readonly imagePos = input.required<Array<number>>();
	readonly urlPrefix = input.required<string>();
	readonly blackout = input(false);
	readonly concealed = input(false);
	readonly interactive = computed(() => !this.concealed() && !this.draw().source.picked() && !this.draw().source.state().blocked);
	readonly app = inject(AppService);
	readonly mark = computed(() => this.concealed() ? undefined : this.draw().source.mark());
	readonly markSpark = computed(() => this.mark() === 'spark');
	readonly covered = computed(() => this.concealed() || (this.blackout() && this.draw().source.state().blocked));
	readonly backUrl = computed(() => this.app.settings.dark() ? '#mah-tile-back-dark' : '#mah-tile-back');
	readonly announced = computed(() => this.interactive() || (!!this.mark() && !this.draw().source.picked()));
	readonly tileLabel = computed(() => {
		this.app.lang(); // translate.instant is not reactive, recompute when the loaded language changes
		const draw = this.draw();
		const name = draw.url ? this.app.translate.instant(draw.url) : '';
		const layer = draw.source.z + 1;
		const key = draw.source.hinted() ? 'TILE_LABEL_HINTED' : 'TILE_LABEL';
		const label = this.app.translate.instant(key, { name, layer });
		const mark = this.mark();
		return mark ? `${label}, ${this.app.translate.instant(MARK_LABELS[mark])}` : label;
	});
}
