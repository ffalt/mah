export function toBase64(value: string): string {
	return window.btoa(value);
}

export function fromBase64(value: string): string {
	return window.atob(value);
}
