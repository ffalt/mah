import { Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import type { SafeUrlSVG } from '../../model/types';
import { DurationPipe } from '../../pipes/duration.pipe';
import { DeferLoadDirective } from '../../directives/defer-load/defer-load.directive';
import { LayoutPreviewComponent } from '../layout-preview/layout-preview.component';
import { IconDeleteComponent } from '../icons/icon-delete.component';
import type { LayoutItem, RandomLayoutItem } from '../layout-list/layout-list.component';

@Component({
	selector: 'div[app-layout-list-item]',
	templateUrl: './layout-list-item.component.html',
	styleUrls: ['./layout-list-item.component.scss'],
	host: {
		'tabindex': '0',
		'role': 'button',
		'[id]': '"item-" + item().layout.id',
		'[class.selected]': 'item().selected()',
		'[attr.aria-pressed]': 'item().selected()',
		'[attr.aria-label]': 'item().layout.name',
		'(click)': 'onActivate($event)',
		'(keydown.enter)': 'onActivate($event)',
		'(keydown.space)': 'onActivate($event)'
	},
	hostDirectives: [DeferLoadDirective],
	imports: [TranslatePipe, DurationPipe, LayoutPreviewComponent, IconDeleteComponent]
})
export class LayoutListItemComponent {
	readonly item = input.required<LayoutItem>();
	readonly random = input(false);
	readonly startEvent = output<void>();
	readonly clearBestTimeEvent = output<void>();
	readonly customDeleteEvent = output<void>();
	readonly seedEvent = output<string>();
	readonly previewSVG = computed<SafeUrlSVG | undefined>(() =>
		(this.random() ? (this.item() as RandomLayoutItem).previewSVG() : undefined));

	readonly seed = computed(() => (this.random() ? (this.item() as RandomLayoutItem).layoutSeed() : ''));

	constructor() {
		inject(DeferLoadDirective).appDeferLoad.subscribe(() => this.item().visible.set(true));
	}

	onActivate(event: Event): void {
		event.preventDefault();
		event.stopPropagation();
		this.startEvent.emit();
	}

	onClearBestTime(event: Event): void {
		event.stopPropagation();
		this.clearBestTimeEvent.emit();
	}

	onRemoveCustom(event: Event): void {
		event.stopPropagation();
		this.customDeleteEvent.emit();
	}
}
