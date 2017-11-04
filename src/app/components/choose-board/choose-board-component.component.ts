import {Component, Input, OnInit} from '@angular/core';
import {Layout, Layouts} from '../../model/layouts';
import {Builder} from '../../model/builder';

@Component({
	selector: 'app-choose-board-component',
	templateUrl: './choose-board-component.component.html',
	styleUrls: ['./choose-board-component.component.scss']
})
export class ChooseBoardComponent implements OnInit {
	@Input() public start: (layout: Layout, mode: string) => void;
	@Input() public layouts: Layouts;
	public onSelectCallback: Event;
	public onStartCallback: Event;
	public focusIndex = 0;
	public current: Layout = null;
	public mode = 'solvable';
	public builder: Builder = new Builder();

	constructor() {
	}

	public ngOnInit() {
		this.onSelectCallback = this.onSelect.bind(this);
		this.onStartCallback = this.onStart.bind(this);
	}

	public onStart(layout: Layout) {
		this.start(layout, this.mode);
	}

	public onSelect(layout: Layout) {
		this.current = layout;
	}

	public randomGame() {
		this.focusIndex = Math.floor(Math.random() * this.layouts.items.length);
	}
}
