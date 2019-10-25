import {Component, ElementRef, Input} from '@angular/core';
import {Layout} from '../../model/layouts';

@Component({
	selector: 'app-layout-list-item',
	templateUrl: './layout-list-item.component.html',
	styleUrls: ['./layout-list-item.component.scss']
})
export class LayoutListItemComponent {
	@Input() layout: Layout;

	constructor(private el: ElementRef) {
	}

	scrollIntoView(): void {
		this.el.nativeElement.scrollIntoView();
	}

}
