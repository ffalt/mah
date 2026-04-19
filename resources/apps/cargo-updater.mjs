import TOML from "@iarna/toml";

export const readVersion = contents => {
	const data = TOML.parse(contents);
	return data.package.version;
};

export const writeVersion = (contents, version) => {
	const data = TOML.parse(contents);
	data.package.version = version;
	return TOML.stringify(data);
};
