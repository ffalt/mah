// btoa/atob only speak Latin-1, so both directions go through UTF-8 bytes to keep non-ASCII board names intact
export function toBase64(value: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCodePoint(byte);
	}
	return window.btoa(binary);
}

export function fromBase64(value: string): string {
	const binary = window.atob(value);
	return new TextDecoder().decode(Uint8Array.from(binary, char => char.codePointAt(0) ?? 0));
}
