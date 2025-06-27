import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Layout, SafeUrlSVG } from '../../../../model/types';

@Component({
	selector: 'app-layout-preview',
	templateUrl: './layout-preview.component.html',
	styleUrls: ['./layout-preview.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	standalone: false
})
export class LayoutPreviewComponent implements OnChanges {
	@Input() layout: Layout;
	@Input() svg: SafeUrlSVG | undefined;
	@Input() alt: string;

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.layout) {
			this.updateLayout(changes.layout.currentValue);
		}
	}

	private updateLayout(layout: Layout): void {
		this.svg = layout.previewSVG;
	}
}
