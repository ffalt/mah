/* eslint-disable unicorn/prefer-uint8array-base64 */

export function toBase64(value: string): string {
	return window.btoa(value);
}

export function fromBase64(value: string): string {
	return window.atob(value);
}
