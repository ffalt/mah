const TOML = require("@iarna/toml");

module.exports.readVersion = (contents) => {
	const data = TOML.parse(contents);
	return data.package.version;
}

module.exports.writeVersion = (contents, version) => {
	const data = TOML.parse(contents);
	data.package.version = version;
	return TOML.stringify(data);
}
