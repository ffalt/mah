import { Component, type OnChanges, type SimpleChanges, inject, input, model } from '@angular/core';
import type { Layout, SafeUrlSVG } from '../../model/types';
import { LayoutService } from '../../service/layout.service';

@Component({
	selector: 'app-layout-preview',
	templateUrl: './layout-preview.component.html',
	styleUrls: ['./layout-preview.component.scss']
})
export class LayoutPreviewComponent implements OnChanges {
	readonly layout = input<Layout>();
	readonly svg = model<SafeUrlSVG>();
	readonly alt = input<string>();

	private readonly layoutService = inject(LayoutService);

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.layout) {
			this.updateLayout(changes.layout.currentValue);
		}
	}

	private updateLayout(layout?: Layout): void {
		this.svg.set(layout ? this.layoutService.getPreview(layout) : undefined);
	}
}
