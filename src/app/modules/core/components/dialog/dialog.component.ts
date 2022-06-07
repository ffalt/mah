import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
	selector: 'app-dialog',
	templateUrl: './dialog.component.html',
	styleUrls: ['./dialog.component.scss']
})
export class DialogComponent {
	@Input() title?: string;
	@Input() visible: boolean = false;
	@Input() noClose: boolean = false;
	@Output() readonly clickEvent = new EventEmitter<boolean>();

	toggle() {
		this.visible = !this.visible;
		this.clickEvent.emit(this.visible);
	}
}
