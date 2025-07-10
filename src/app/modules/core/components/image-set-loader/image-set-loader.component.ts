import { Component, ElementRef, inject, type OnChanges, type SimpleChanges, input } from '@angular/core';
import { SvgdefService } from '../../../../service/svgdef.service';
import { TILES } from '../../../../model/consts';
import { svg_error_icon, svg_spinner_icon } from './svg';

@Component({
	selector: '[app-image-set-loader]',
	template: '<svg:defs></svg:defs>',
	standalone: false
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
		const sl: Array<string> = [svg_spinner_icon];
		TILES.forEach(row => {
			row.forEach(id => {
				sl.push(`<svg id="${id}" width="75" height="100"><use xlink:href="#mah-tile-spinner" transform="translate(26,42)"></use></svg>`);
			})
		})
		this.setImageSet(`<svg><defs>${sl.join('')}</defs></svg>`);
	}

	private prepareDefs(svg: string): string {
		const s = svg.split('<defs>')[1].split('</defs>')[0];
		return s.replace(/xlink:href="\./g, 'xlink:href="assets/svg')
			.replace(/ id="t_/g, ` id="${this.prefix()}t_`);
	}

	private setError(): void {
		const sl: Array<string> = [svg_error_icon];
		TILES.forEach(row => {
			row.forEach(id => {
				sl.push(`<svg id="${id}" width="75" height="100"><use xlink:href="#mah-error-icon" transform="translate(8,18)"></use></svg>`);
			})
		})
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
			.catch(e => {
				this.setError();
				console.error(e);
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
