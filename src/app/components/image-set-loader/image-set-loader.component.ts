import {Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import {SvgdefService} from '../../service/svgdef.service';

@Component({
	// tslint:disable-next-line:component-selector
	selector: '[app-image-set-loader]',
	template: '<svg:defs></svg:defs>'
})
export class ImageSetLoaderComponent implements OnChanges {
	@Input() imageSet: string;
	@Input() prefix: string;

	constructor(private elementRef: ElementRef, private svgdef: SvgdefService) {
	}

	ngOnChanges(changes: SimpleChanges): void {
		this.getImageSet();
	}

	private getImageSet(): void {
		if (!this.imageSet) {
			return;
		}
		this.svgdef.get(this.imageSet)
			.then(def => {
				let s = def.split('<defs>')[1].split('</defs>')[0];
				s = s.replace(/xlink:href="\./g, 'xlink:href="assets/svg')
					.replace(/ id="t_/g, ` id="${this.prefix}t_`);
				setTimeout(() => {
					while (this.elementRef.nativeElement.firstChild) {
						this.elementRef.nativeElement.removeChild(this.elementRef.nativeElement.firstChild);
					}
					this.elementRef.nativeElement.innerHTML = s;
					if (!this.elementRef.nativeElement.firstChild) {
						const doc = new DOMParser().parseFromString(
							`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${s}</svg>`, 'application/xml');
						const node = this.elementRef.nativeElement.ownerDocument.importNode(doc.documentElement, true);
						this.elementRef.nativeElement.appendChild(node);
					}
				}, 0);
			})
			.catch(e => {
				console.error(e);
			});
	}
}
