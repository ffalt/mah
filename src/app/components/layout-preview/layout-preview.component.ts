import { ChangeDetectionStrategy, Component, type OnChanges, type SimpleChanges, input, model } from '@angular/core';
import type { Layout, SafeUrlSVG } from '../../model/types';

@Component({
	selector: 'app-layout-preview',
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './layout-preview.component.html',
	styleUrls: ['./layout-preview.component.scss']
})
export class LayoutPreviewComponent implements OnChanges {
	readonly layout = input<Layout>();
	readonly svg = model<SafeUrlSVG>();
	readonly alt = input<string>();

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.layout) {
			this.updateLayout(changes.layout.currentValue);
		}
	}

	private updateLayout(layout?: Layout): void {
		this.svg.set(layout?.previewSVG);
	}
}
