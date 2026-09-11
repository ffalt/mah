import { Component, ElementRef, effect, inject, input, model, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconCloseComponent } from '../icons/icon-close.component';
import { IconLogoComponent } from '../icons/icon-logo.component';
import { focusableElements, trapFocus } from '../../model/dom-utilities';

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

	// tabbing out of the popup lands on a guard, from there focus goes back to the other end of the dialog
	focusEdge(leading: boolean): void {
		const popup = this.popup();
		if (!popup) {
			return;
		}
		const focusable = focusableElements(popup);
		const target = leading ? focusable.at(-1) : focusable.at(0);
		(target ?? popup).focus();
	}

	trapFocus(event: KeyboardEvent): void {
		if (event.key === 'Tab') {
			event.stopPropagation();
		}
		trapFocus(this.popup(), event);
	}

	private setVisible(visible: boolean): void {
		if (this.visible() === visible) {
			return;
		}
		this.visible.set(visible);
		this.clickEvent.emit(visible);
	}

	private popup(): HTMLElement | null {
		return (this.elementRef.nativeElement as HTMLElement).querySelector<HTMLElement>('.overlay-popup');
	}

	private focusDialog(): void {
		const popup = this.popup();
		if (popup && this.isTopmost(popup)) {
			popup.focus();
		}
	}

	// a dialog opening as a side effect of another one, like the pause message, must not pull focus off the visible one
	private isTopmost(popup: HTMLElement): boolean {
		const overlay = popup.parentElement;
		if (!overlay) {
			return false;
		}
		const level = (element: HTMLElement): number => Number(getComputedStyle(element).zIndex) || 0;
		const own = level(overlay);
		return Array.from(document.querySelectorAll<HTMLElement>('.overlay'))
			.every(other => other === overlay || level(other) <= own);
	}

	private restoreFocus(): void {
		if (this.previousFocus instanceof HTMLElement) {
			this.previousFocus.focus();
		}
		this.previousFocus = null;
	}
}
