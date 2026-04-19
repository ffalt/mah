export default {
	extends: ["stylelint-config-standard", "stylelint-config-standard-scss"],
	ignoreFiles: [
		"./angular/**",
		"./dist/**",
		"./coverage/**",
		"./resources/apps/**",
		"./local/**"
	]
};
