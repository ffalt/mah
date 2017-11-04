import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {Layout} from '../../model/layouts';

@Component({
	selector: '[app-layout-list-item]',
	templateUrl: './layout-list-item.component.html',
	styleUrls: ['./layout-list-item.component.scss']
})
export class LayoutListItemComponent implements OnInit {

	@Input() public layout: Layout;

	constructor(public el: ElementRef) {
	}

	public scrollIntoView() {
		this.el.nativeElement.scrollIntoView();
	}

	ngOnInit() {
	}

}
