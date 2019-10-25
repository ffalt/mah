import {Component, EventEmitter, Input, OnChanges, Output, QueryList, SimpleChanges, ViewChildren} from '@angular/core';
import {Layout, Layouts} from '../../model/layouts';
import {LayoutListItemComponent} from '../layout-list-item/layout-list-item.component';

@Component({
	selector: 'app-layout-list',
	templateUrl: './layout-list.component.html',
	styleUrls: ['./layout-list.component.scss']
})
export class LayoutListComponent implements OnChanges {
	@Input() layouts: Layouts;
	@Input() index = 0;
	@Output() readonly selectEvent = new EventEmitter<Layout>();
	@Output() readonly startEvent = new EventEmitter<Layout>();
	@ViewChildren(LayoutListItemComponent) children: QueryList<LayoutListItemComponent>;
	current: Layout = undefined;

	ngOnChanges(changes: SimpleChanges): void {
		if ((changes.layouts || changes.index) && this.layouts) {
			this.setCurrent(this.layouts.items[this.index], true);
		}
	}

	setSelected(layout: Layout): void {
		this.startEvent.emit(layout);
	}

	setCurrent(layout: Layout, scrollIntoView?: boolean): void {
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
		this.selectEvent.emit(layout);
	}

	onKeydown(event: KeyboardEvent): void {
		switch (event.keyCode) {
			case 13:
			case 32:
				this.selectEvent.emit(this.current);
				event.stopPropagation();
				return;
			case 38:
				if (this.index === 0) {
					this.index = this.layouts.items.length - 1;
				} else {
					this.index--;
				}
				this.setCurrent(this.layouts.items[this.index], true);
				event.stopPropagation();
				return;
			case 40:
				if (this.index + 1 === this.layouts.items.length) {
					this.index = 0;
				} else {
					this.index++;
				}
				this.setCurrent(this.layouts.items[this.index], true);
				event.stopPropagation();
				return;
			default:
				return;
		}
	}

}
