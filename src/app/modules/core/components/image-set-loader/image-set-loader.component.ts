import {Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {SvgdefService} from '../../../../service/svgdef.service';
import {Stone} from '../../../../model/stone';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[app-image-set-loader]',
	template: '<svg:defs></svg:defs>'
})
export class ImageSetLoaderComponent implements OnChanges {
	@Input() imageSet: string;
	@Input() prefix: string;
	@Input() dark: boolean = false;

	constructor(private elementRef: ElementRef, private svgdef: SvgdefService) {
	}

	ngOnChanges(_: SimpleChanges): void {
		this.getImageSet();
	}

	private getImageSet(): void {
		if (!this.imageSet) {
			return;
		}
		const imageSet = this.imageSet + (this.dark ? '-black' : '');
		this.svgdef.get(imageSet)
			.then(def => {
				let s = def.split('<defs>')[1].split('</defs>')[0];
				s = s.replace(/xlink:href="\./g, 'xlink:href="assets/svg')
					.replace(/ id="t_/g, ` id="${this.prefix}t_`);
				this.elementRef.nativeElement.innerHTML = '';
				setTimeout(() => {
					this.elementRef.nativeElement.innerHTML = s;
					// if (!this.elementRef.nativeElement.firstChild) {
					// const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${s}</svg>`, 'application/xml');
					// const node = this.elementRef.nativeElement.ownerDocument.importNode(doc.documentElement, true);
					// this.elementRef.nativeElement.appendChild(node);
					// }
				}, 0);
			})
			.catch(e => {
				console.error(e);
			});
	}
}
