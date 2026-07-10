export function isFormControlTarget(target: EventTarget | null): boolean {
	const nodeName = target instanceof Element ? target.nodeName.toLowerCase() : '';
	return ['input', 'textarea', 'select', 'button'].includes(nodeName);
}
