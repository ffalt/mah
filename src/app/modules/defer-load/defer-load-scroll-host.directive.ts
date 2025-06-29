import { Directive, ElementRef, inject, OnChanges, SimpleChange, input } from '@angular/core';
import { DeferLoadService } from './defer-load.service';

@Directive({
	selector: '[appDeferLoadScrollHost]',
	standalone: false,
	host: { '(scroll)': 'scrollTrack($event)' }
})
export class DeferLoadScrollHostDirective implements OnChanges {
	readonly scrollTo = input<HTMLElement>();
	private element = inject(ElementRef);
	private scrollNotify = inject(DeferLoadService);

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

	scrollTrack(_: Event): void {
		this.scrollNotify.notifyScroll({ name: 'scroll-host', element: this.element.nativeElement });
	}
}
