export const readVersion = contents => {
	const match = contents.match(/^ARG MAH_VERSION=(.+)$/m);
	return match ? match[1] : null;
};

export const writeVersion = (contents, version) =>
	contents.replace(/^(ARG MAH_VERSION=).+$/m, `$1${version}`);
