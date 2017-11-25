import {Component, ElementRef, Input, OnChanges, SimpleChanges} from '@angular/core';
import {SvgdefService} from '../../service/svgdef.service';

@Component({
	selector: '[app-image-set-loader]',
	template: '<svg:defs></svg:defs>'
})
export class ImageSetLoaderComponent implements OnChanges {

	@Input()
	imageSet: string;

	@Input()
	prefix: string;

	constructor(private elementRef: ElementRef, private svgdef: SvgdefService) {
	}

	public ngOnChanges(changes: SimpleChanges): void {
		console.log(changes);
		this.getImageSet();
	}

	private getImageSet() {
		if (!this.imageSet) {
			return;
		}
		this.svgdef.get(this.imageSet, (def) => {
			let s = def.split('<defs>')[1].split('</defs>')[0];
			s = s.replace(/xlink:href="\./g, 'xlink:href="assets/svg').replace(/ id="t_/g, ' id="' + this.prefix + 't_');
			setTimeout(() => {
				this.elementRef.nativeElement.innerHTML = s;
			}, 0);
		});

	}
}
