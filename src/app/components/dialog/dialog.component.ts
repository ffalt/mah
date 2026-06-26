import { Component, ElementRef, effect, inject, input, model, output, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { IconCloseComponent } from '../icons/icon-close.component';
import { IconLogoComponent } from '../icons/icon-logo.component';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
	selector: 'app-dialog',
	changeDetection: ChangeDetectionStrategy.Eager,
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
		this.visible.set(!this.visible());
		this.clickEvent.emit(this.visible());
	}

	trapFocus(event: KeyboardEvent): void {
		if (event.key !== 'Tab') {
			return;
		}
		const host = this.elementRef.nativeElement as HTMLElement;
		const popup = host.querySelector<HTMLElement>('.overlay-popup');
		if (!popup) {
			return;
		}
		const focusable = Array.from(popup.querySelectorAll<HTMLElement>(FOCUSABLE))
			.filter(element => element.offsetParent !== null);
		if (focusable.length === 0) {
			return;
		}
		const first = focusable.at(0);
		const last = focusable.at(-1);
		if (last && event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (first && !event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
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
