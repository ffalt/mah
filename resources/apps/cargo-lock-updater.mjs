import TOML from "@iarna/toml";

const findRootPackage = data => {
	return data.package.find(entry => entry.name === "mah");
};

export const readVersion = contents => {
	const data = TOML.parse(contents);
	return findRootPackage(data).version;
};

export const writeVersion = (contents, version) => {
	const data = TOML.parse(contents);
	findRootPackage(data).version = version;
	return TOML.stringify(data);
};
