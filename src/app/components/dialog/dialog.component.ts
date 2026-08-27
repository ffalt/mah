import { Component, ElementRef, effect, inject, input, model, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconCloseComponent } from '../icons/icon-close.component';
import { IconLogoComponent } from '../icons/icon-logo.component';
import { trapFocus } from '../../model/dom-utilities';

@Component({
	selector: 'app-dialog',
	templateUrl: './dialog.component.html',
	styleUrls: ['./dialog.component.scss'],
	imports: [TranslatePipe, IconLogoComponent, IconCloseComponent]
})
export class DialogComponent {
	private static nextId = 0;
	readonly dialogId = `dialog-${++DialogComponent.nextId}`;

	readonly title = input<string>();
	readonly className = input<string>();
	readonly visible = model<boolean>(false);
	readonly noCloseButton = input<boolean>(false);
	readonly allowCloseOverlay = input<boolean>(true);
	readonly clickEvent = output<boolean>();

	private readonly elementRef = inject(ElementRef);
	private previousFocus: Element | null = null;

	constructor() {
		effect(() => {
			if (this.visible()) {
				this.previousFocus = document.activeElement;
				setTimeout(() => this.focusDialog(), 0);
			} else {
				this.restoreFocus();
			}
		});
	}

	toggleOverlay() {
		if (this.allowCloseOverlay()) {
			this.toggle();
		}
	}

	toggle() {
		this.setVisible(!this.visible());
	}

	open() {
		this.setVisible(true);
	}

	close() {
		this.setVisible(false);
	}

	trapFocus(event: KeyboardEvent): void {
		if (event.key === 'Tab') {
			event.stopPropagation();
		}
		const host = this.elementRef.nativeElement as HTMLElement;
		trapFocus(host.querySelector<HTMLElement>('.overlay-popup'), event);
	}

	private setVisible(visible: boolean): void {
		if (this.visible() === visible) {
			return;
		}
		this.visible.set(visible);
		this.clickEvent.emit(visible);
	}

	private focusDialog(): void {
		const host = this.elementRef.nativeElement as HTMLElement;
		const popup = host.querySelector<HTMLElement>('.overlay-popup');
		if (!popup) {
			return;
		}
		popup.focus();
	}

	private restoreFocus(): void {
		if (this.previousFocus instanceof HTMLElement) {
			this.previousFocus.focus();
		}
		this.previousFocus = null;
	}
}
