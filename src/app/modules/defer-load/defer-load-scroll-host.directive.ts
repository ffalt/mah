import {Directive, ElementRef, HostListener, Input, OnChanges, SimpleChange} from '@angular/core';
import {DeferLoadService} from './defer-load.service';

@Directive({
	selector: '[appDeferLoadScrollHost]'
})
export class DeferLoadScrollHostDirective implements OnChanges {
	@Input() scrollTo: any;

	constructor(private element: ElementRef, private scrollNotify: DeferLoadService) {
	}

	ngOnChanges(changes: { [propName: string]: SimpleChange }): void {
		if (changes.scrollTo && changes.scrollTo.currentValue) {
			const o = changes.scrollTo.currentValue;
			if (o.id && o.id.length > 0) {
				const elm = document.getElementById(o.id);
				if (elm) {
					this.element.nativeElement.scrollTop = elm.offsetTop - elm.offsetHeight;
				}
			}
		}
	}

	@HostListener('scroll', ['$event'])
	scrollTrack(_: Event): void {
		this.scrollNotify.notifyScroll({name: 'scroll-host', element: this.element.nativeElement});
	}
}
