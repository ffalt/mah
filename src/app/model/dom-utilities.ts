const NATIVE_BUTTON_KEYS = new Set([' ', 'space', 'Space', 'spacebar', 'Spacebar', 'Enter']);

export function isFormControlTarget(target: EventTarget | null): boolean {
	const nodeName = target instanceof Element ? target.nodeName.toLowerCase() : '';
	return ['input', 'textarea', 'select'].includes(nodeName);
}

// a focused button fires its click on Space and Enter by itself, handling those again would trigger twice
export function isNativeButtonKey(target: EventTarget | null, key: string): boolean {
	const nodeName = target instanceof Element ? target.nodeName.toLowerCase() : '';
	return nodeName === 'button' && NATIVE_BUTTON_KEYS.has(key);
}
