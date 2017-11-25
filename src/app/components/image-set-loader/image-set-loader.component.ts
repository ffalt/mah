import {Component, OnInit, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import {SvgdefService} from '../../service/svgdef.service';

export const imageSets = [
	{id: 'riichi', name: 'SVG Riichi'},
	{id: 'gleitz', name: 'PNG Gleitz'},
	{id: 'bzhmaddog', name: 'SVG Bzhmaddog'},
	{id: 'recri', name: 'PNG Recri'},
	{id: 'recri2', name: 'SVG Recri'},
	{id: 'cheshire137', name: 'SVG Cheshire137'},
	{id: 'open-classic', name: 'PNG Open Classic'}
];

@Component({
	selector: '[app-image-set-loader]',
	template: '<svg:defs></svg:defs>'
})
export class ImageSetLoaderComponent implements OnInit, OnChanges {

	@Input()
	imageSet: string;

	constructor(private elementRef: ElementRef, private svgdef: SvgdefService) {
	}

	ngOnInit() {
		if (this.imageSet) {
			this.svgdef.get(this.imageSet, (def) => {
				const s = def.replace(/xlink:href="\./g, 'xlink:href="assets/svg').split('<defs>')[1].split('</defs>')[0];
				setTimeout(() => {
					this.elementRef.nativeElement.innerHTML = s;
				}, 0);
			});
		}
	}

	public ngOnChanges(changes: SimpleChanges): void {
		this.ngOnInit();
	}
}
