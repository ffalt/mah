import { describe, it, expect, afterEach } from 'vitest';
import { isFormControlTarget, isNativeButtonKey, trapFocus } from './dom-utilities';

// jsdom does no layout, so offsetParent is always null and every element would look hidden
function markVisible(element: HTMLElement): HTMLElement {
	Object.defineProperty(element, 'offsetParent', { value: document.body, configurable: true });
	return element;
}

function popup(count: number, visible = true): { container: HTMLElement; buttons: Array<HTMLButtonElement> } {
	const container = document.createElement('div');
	const buttons = Array.from({ length: count }, (_value, index) => {
		const button = document.createElement('button');
		button.textContent = `b${index}`;
		container.append(button);
		if (visible) {
			markVisible(button);
		}
		return button;
	});
	document.body.append(container);
	return { container, buttons };
}

function tab(shiftKey = false): KeyboardEvent {
	return new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });
}

describe('dom-utilities', () => {
	afterEach(() => {
		document.body.replaceChildren();
	});

	describe('trapFocus', () => {
		it('wraps from the last focusable back to the first', () => {
			const { container, buttons } = popup(3);
			buttons[2].focus();
			const event = tab();

			trapFocus(container, event);

			expect(document.activeElement).toBe(buttons[0]);
			expect(event.defaultPrevented).toBe(true);
		});

		it('wraps backwards from the first to the last', () => {
			const { container, buttons } = popup(3);
			buttons[0].focus();
			const event = tab(true);

			trapFocus(container, event);

			expect(document.activeElement).toBe(buttons[2]);
			expect(event.defaultPrevented).toBe(true);
		});

		it('leaves tabbing in the middle alone', () => {
			const { container, buttons } = popup(3);
			buttons[1].focus();
			const event = tab();

			trapFocus(container, event);

			expect(document.activeElement).toBe(buttons[1]);
			expect(event.defaultPrevented).toBe(false);
		});

		it('ignores keys that are not Tab', () => {
			const { container, buttons } = popup(3);
			buttons[2].focus();
			const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });

			trapFocus(container, event);

			expect(document.activeElement).toBe(buttons[2]);
			expect(event.defaultPrevented).toBe(false);
		});

		it('does nothing without a container', () => {
			const event = tab();
			expect(() => trapFocus(undefined, event)).not.toThrow();
			expect(() => trapFocus(null, event)).not.toThrow();
			expect(event.defaultPrevented).toBe(false);
		});

		it('skips hidden controls rather than trapping focus on them', () => {
			const { container, buttons } = popup(2, false);
			markVisible(buttons[0]);
			buttons[0].focus();
			const event = tab();

			// the only visible control is both first and last, so tab wraps onto itself
			trapFocus(container, event);

			expect(document.activeElement).toBe(buttons[0]);
			expect(event.defaultPrevented).toBe(true);
		});

		it('does nothing when the container holds no focusable control', () => {
			const container = document.createElement('div');
			container.append(document.createElement('p'));
			document.body.append(container);
			const event = tab();

			trapFocus(container, event);

			expect(event.defaultPrevented).toBe(false);
		});
	});

	describe('isFormControlTarget', () => {
		it('spots the controls that own their own keys', () => {
			expect(isFormControlTarget(document.createElement('input'))).toBe(true);
			expect(isFormControlTarget(document.createElement('select'))).toBe(true);
			expect(isFormControlTarget(document.createElement('textarea'))).toBe(true);
			expect(isFormControlTarget(document.createElement('div'))).toBe(false);
			expect(isFormControlTarget(null)).toBe(false);
		});
	});

	describe('isNativeButtonKey', () => {
		it('spots the keys a focused button already handles', () => {
			const button = document.createElement('button');
			expect(isNativeButtonKey(button, 'Enter')).toBe(true);
			expect(isNativeButtonKey(button, ' ')).toBe(true);
			expect(isNativeButtonKey(button, 'h')).toBe(false);
			expect(isNativeButtonKey(document.createElement('div'), 'Enter')).toBe(false);
		});
	});
});
