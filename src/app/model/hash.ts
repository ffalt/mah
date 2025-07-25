export function hashString(s: string): number {
	if (s.length === 0) {
		return 0;
	}
	return hashCode(s) + 2_147_483_647;
}

export function hashCode(s: string) {
	let hash = 0;
	for (let index = 0; index < s.length; index++) {
		const chr = s.codePointAt(index) ?? 0;
		hash = (hash << 5) - hash + chr;
		// eslint-disable-next-line unicorn/prefer-math-trunc
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}
