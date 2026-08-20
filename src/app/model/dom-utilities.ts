const NATIVE_BUTTON_KEYS = new Set([' ', 'space', 'Space', 'spacebar', 'Spacebar', 'Enter']);

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// keeps Tab inside a modal, which aria-modal alone only promises
export function trapFocus(container: HTMLElement | null | undefined, event: KeyboardEvent): void {
	if (!container || event.key !== 'Tab') {
		return;
	}
	const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE))
		.filter(element => element.offsetParent !== null);
	const first = focusable.at(0);
	const last = focusable.at(-1);
	if (!first || !last) {
		return;
	}
	if (event.shiftKey && document.activeElement === first) {
		event.preventDefault();
		last.focus();
	} else if (!event.shiftKey && document.activeElement === last) {
		event.preventDefault();
		first.focus();
	}
}

export function isFormControlTarget(target: EventTarget | null): boolean {
	const nodeName = target instanceof Element ? target.nodeName.toLowerCase() : '';
	return ['input', 'textarea', 'select'].includes(nodeName);
}

// a focused button fires its click on Space and Enter by itself, handling those again would trigger twice
export function isNativeButtonKey(target: EventTarget | null, key: string): boolean {
	const nodeName = target instanceof Element ? target.nodeName.toLowerCase() : '';
	return nodeName === 'button' && NATIVE_BUTTON_KEYS.has(key);
}
