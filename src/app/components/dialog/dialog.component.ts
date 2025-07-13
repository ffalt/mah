import { Component, input, model, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
	selector: 'app-dialog',
	templateUrl: './dialog.component.html',
	styleUrls: ['./dialog.component.scss'],
	imports: [TranslatePipe]
})
export class DialogComponent {
	readonly title = input<string>();
	readonly className = input<string>();
	readonly visible = model<boolean>(false);
	readonly noClose = input<boolean>(false);
	readonly clickEvent = output<boolean>();

	toggle() {
		this.visible.set(!this.visible());
		this.clickEvent.emit(this.visible());
	}
}
