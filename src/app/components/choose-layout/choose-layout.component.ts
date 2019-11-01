import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Builder} from '../../model/builder';
import {Layout, Layouts} from '../../model/layouts';
import {LayoutService} from '../../service/layout.service';

export interface LayoutItem {
	layout: Layout;
	visible: boolean;
}

export interface LayoutGroup {
	name: string;
	layouts: Array<LayoutItem>;
	visible: boolean;
}

@Component({
	selector: 'app-choose-layout',
	templateUrl: './choose-layout.component.html',
	styleUrls: ['./choose-layout.component.scss']
})
export class ChooseLayoutComponent implements OnChanges {
	@Input() layouts: Layouts;
	@Output() readonly startEvent = new EventEmitter<{ layout: Layout, mode: string }>();
	groups: Array<LayoutGroup> = [];
	mode: string = 'MODE_SOLVABLE';
	builder: Builder = new Builder();

	constructor(private layoutService: LayoutService) {
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (this.layouts) {
			this.buildGroups();
		}
	}

	onStart(layout: Layout): void {
		if (layout) {
			this.startEvent.emit({layout, mode: this.mode});
		}
	}

	buildGroups(): void {
		const groups: Array<LayoutGroup> = [];
		const g: { [name: string]: LayoutGroup } = {};
		for (const layout of this.layouts.items) {
			if (!g[layout.category]) {
				g[layout.category] = {name: layout.category, layouts: [], visible: false};
				groups.push(g[layout.category]);
			}
			g[layout.category].layouts.push({layout, visible: false});
		}
		this.groups = groups;
	}

	randomGame(): void {
		const index = Math.floor(Math.random() * this.layouts.items.length);
		this.startEvent.emit({layout: this.layouts.items[index], mode: this.mode});
	}

	onDrop(files: Array<File>): void {
		this.layoutService.importFile(files[0])
			.then(layout => {
				this.layouts.items.push(layout);
				this.buildGroups();
			})
			.catch(e => {
				alert(e);
			});
	}

	scrollToGroup(index: number): void {
		const elements = document.getElementById(`group-${index}`);
		elements.scrollIntoView();
	}
}
