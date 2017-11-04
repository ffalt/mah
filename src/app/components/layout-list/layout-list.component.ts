import {Component, Input, OnChanges, OnInit, QueryList, SimpleChanges, ViewChildren} from '@angular/core';
import {Layout, Layouts} from '../../model/layouts';
import {LayoutListItemComponent} from '../layout-list-item/layout-list-item.component';

@Component({
	selector: 'app-layout-list',
	templateUrl: './layout-list.component.html',
	styleUrls: ['./layout-list.component.scss']
})
export class LayoutListComponent implements OnInit, OnChanges {
	@Input() public layouts: Layouts;
	@Input() public index = 0;
	@Input() public select: (layout: Layout) => void;
	@Input() public start: (layout: Layout) => void;
	@ViewChildren(LayoutListItemComponent) public children: QueryList<LayoutListItemComponent>;

	public current: Layout = null;

	constructor() {
	}

	public ngOnChanges(changes: SimpleChanges) {
		if (changes['index'] && this.layouts) {
			this.setCurrent(this.layouts.items[this.index], true);
		}
		if (changes['layouts'] && this.layouts) {
			this.setCurrent(this.layouts.items[this.index], true);
		}
	}

	public setSelected(layout: Layout) {
		if (this.start) {
			this.start(layout);
		}
	}

	public setCurrent(layout: Layout, scrollIntoView: boolean) {
		if (!layout) {
			return;
		}
		this.index = layout.index;
		this.current = layout;
		if (scrollIntoView && this.children) {
			this.children.toArray().forEach((child: LayoutListItemComponent) => {
				if (child.layout === layout) {
					child.scrollIntoView();
				}
			});
		}
		if (this.select) {
			this.select(layout);
		}
	}

	public onKeydown(event: KeyboardEvent) {
		switch (event.keyCode) {
			case 13:
			case 32:
				this.select(this.current);
				event.stopPropagation();
				return false;
			case 38:
				if (this.index === 0) {
					this.index = this.layouts.items.length - 1;
				} else {
					this.index--;
				}
				this.setCurrent(this.layouts.items[this.index], true);
				event.stopPropagation();
				return false;
			case 40:
				if (this.index + 1 === this.layouts.items.length) {
					this.index = 0;
				} else {
					this.index++;
				}
				this.setCurrent(this.layouts.items[this.index], true);
				event.stopPropagation();
				return false;
		}
		return true;
	}

	ngOnInit() {
	}

}
