import { Component, ElementRef, type OnChanges, type SimpleChanges, inject, input } from '@angular/core';
import { SvgdefService } from '../../service/svgdef.service';
import { log } from '../../model/log';
import { TILES } from '../../model/consts';
import { svg_error_icon, svgSpinnerIcon } from './svg';

@Component({
	selector: '[app-image-set-loader]',
	template: '<svg:defs></svg:defs>'
})
export class ImageSetLoaderComponent implements OnChanges {
	readonly imageSet = input<string>();
	readonly kyodaiUrl = input<string>();
	readonly prefix = input<string>();
	readonly dark = input<boolean>(false);
	private readonly elementRef = inject(ElementRef);
	private readonly svgDef = inject(SvgdefService);

	ngOnChanges(_: SimpleChanges): void {
		this.getImageSet();
	}

	private setLoading(): void {
		const sl: Array<string> = [svgSpinnerIcon(this.dark())];
		const translate = this.imageSet() === 'kyodai' ? 'translate(25.5,38)' : 'translate(20,36)';
		for (const row of TILES) {
			for (const id of row) {
				sl.push(`<svg id="${id}" width="75" height="100"><use xlink:href="#mah-tile-spinner" transform="${translate}"></use></svg>`);
			}
		}
		this.setImageSet(`<svg><defs>${sl.join('')}</defs></svg>`);
	}

	private prepareDefs(svg: string): string {
		const startIndex = svg.indexOf('<defs>');
		const endIndex = svg.lastIndexOf('</defs>');
		const s = startIndex !== -1 && endIndex !== -1 && endIndex > startIndex + 6 ?
			svg.slice(startIndex + 6, endIndex) :
			'';
		const safePrefix = (this.prefix() ?? '').replace(/[^a-zA-Z0-9_-]/g, '');
		return s.replace(/xlink:href="\./g, 'xlink:href="assets/svg')
			.replace(/ id="t_/g, ` id="${safePrefix}t_`);
	}

	private setError(): void {
		const sl: Array<string> = [svg_error_icon];
		for (const row of TILES) {
			for (const id of row) {
				sl.push(`<svg id="${id}" width="75" height="100"><use xlink:href="#mah-error-icon" transform="translate(8,18)"></use></svg>`);
			}
		}
		this.setImageSet(`<svg><defs>${sl.join('')}</defs></svg>`);
	}

	private setImageSet(svg: string): void {
		this.elementRef.nativeElement.innerHTML = '';
		const defs = this.prepareDefs(svg);
		setTimeout(() => {
			this.elementRef.nativeElement.innerHTML = defs;
		}, 0);
	}

	private loadImageSet(): void {
		const imageSet = this.imageSet() + (this.dark() ? '-black' : '');
		this.svgDef.get(imageSet, this.kyodaiUrl())
			.then(svg => {
				this.setImageSet(svg);
			})
			.catch(error => {
				this.setError();
				log.error(error);
			});
	}

	private getImageSet(): void {
		if (!this.imageSet()) {
			return;
		}
		this.setLoading();
		setTimeout(() => this.loadImageSet(), 0);
	}
}
