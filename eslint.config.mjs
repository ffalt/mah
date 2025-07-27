import eslint from "@eslint/js";
import angular from "angular-eslint";
import ts from "typescript-eslint";
import pluginJest from "eslint-plugin-jest";
import globals from "globals";
import rxjsX from "eslint-plugin-rxjs-x";
import unicorn from "eslint-plugin-unicorn";
import stylistic from "@stylistic/eslint-plugin";

// Common rules shared across configurations
const commonRules = {
	"arrow-body-style": ["error", "as-needed"],
	"arrow-parens": ["error", "as-needed"],
	"brace-style": ["error", "1tbs"],
	"class-methods-use-this": "off",
	"comma-dangle": "error",
	"complexity": ["error", { max: 20 }],
	"default-case": "error",
	"max-classes-per-file": ["error", 2],
	"max-len": ["error", { code: 240 }],
	"max-lines": ["error", 1000],
	"no-duplicate-case": "error",
	"no-duplicate-imports": "error",
	"no-empty": "error",
	"no-extra-bind": "error",
	"no-invalid-this": "error",
	"no-multiple-empty-lines": ["error", { max: 1 }],
	"no-new-func": "error",
	"no-param-reassign": "error",
	"no-return-await": "error",
	"no-sequences": "error",
	"no-sparse-arrays": "error",
	"no-template-curly-in-string": "error",
	"no-void": "error",
	"prefer-const": "error",
	"prefer-object-spread": "error",
	"prefer-template": "error",
	"space-in-parens": ["error", "never"],
	"yoda": "error"
};

// Common stylistic rules
const commonStylisticRules = {
	"@stylistic/semi": ["error", "always"],
	"@stylistic/comma-dangle": ["error", "never"],
	"@stylistic/arrow-parens": ["error", "as-needed"],
	"@stylistic/indent": ["error", "tab"],
	"@stylistic/no-tabs": ["error", { allowIndentationTabs: true }],
	"@stylistic/member-delimiter-style": ["error", {
		"multiline": { "delimiter": "semi", "requireLast": true },
		"singleline": { "delimiter": "semi", "requireLast": false },
		"multilineDetection": "brackets"
	}],
	"@stylistic/quote-props": ["error", "consistent"],
	"@stylistic/brace-style": ["error", "1tbs", { "allowSingleLine": true }],
	"@stylistic/operator-linebreak": ["error", "after"],
	"@stylistic/type-annotation-spacing": "error",
	"@stylistic/linebreak-style": ["error", "unix"],
	"@stylistic/no-trailing-spaces": "error"
};

// Common TypeScript rules
const commonTypeScriptRules = {
	"@typescript-eslint/array-type": ["error", { default: "generic" }],
	"@typescript-eslint/await-thenable": "error",
	"@typescript-eslint/ban-ts-comment": "error",
	"@typescript-eslint/consistent-indexed-object-style": "off",
	"@typescript-eslint/consistent-type-definitions": "error",
	"@typescript-eslint/explicit-member-accessibility": ["error", { accessibility: "no-public" }],
	"@typescript-eslint/naming-convention": "off",
	"@typescript-eslint/no-empty-function": "error",
	"@typescript-eslint/no-empty-object-type": "off",
	"@typescript-eslint/no-floating-promises": "error",
	"@typescript-eslint/no-for-in-array": "error",
	"@typescript-eslint/no-inferrable-types": "off",
	"@typescript-eslint/no-namespace": "error",
	"@typescript-eslint/no-require-imports": "error",
	"@typescript-eslint/no-this-alias": "error",
	"@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
	"@typescript-eslint/no-unnecessary-type-arguments": "error",
	"@typescript-eslint/no-unnecessary-type-assertion": "error",
	"@typescript-eslint/no-unused-expressions": ["error", { allowShortCircuit: true }],
	"@typescript-eslint/no-var-requires": "error",
	"@typescript-eslint/prefer-readonly": "error",
	"@typescript-eslint/promise-function-async": "error",
	"@typescript-eslint/restrict-plus-operands": "error",
	"@typescript-eslint/no-unused-vars": [
		"error",
		{
			"args": "all",
			"argsIgnorePattern": "^_",
			"caughtErrors": "all",
			"caughtErrorsIgnorePattern": "^_",
			"destructuredArrayIgnorePattern": "^_",
			"varsIgnorePattern": "^_",
			"ignoreRestSiblings": true
		}
	]
};

const commonUnicornRules = {
	"unicorn/prefer-top-level-await": "off",
	"unicorn/relative-url-style": "off",
	"unicorn/no-useless-promise-resolve-reject": "off",
	"unicorn/consistent-function-scoping": "off",
	"unicorn/empty-brace-spaces": "off",
	"unicorn/prefer-query-selector": "off",
	"unicorn/prefer-global-this": "off",
	"unicorn/no-null": "off",
	"unicorn/prefer-string-replace-all": "off",
	"unicorn/no-useless-undefined": "off",
	"unicorn/prevent-abbreviations": [
		"error",
		{
			"replacements": {
				"env": false,
				"doc": false,
				"num": false
			}
		}
	]
};

export default ts.config(
	{
		ignores: [
			"**/.angular/**/*",
			"**/.qlty/**/*",
			"**/dist/**/*",
			"**/local/**/*",
			"**/coverage/**/*",
			"**/node_modules/**/*",
			"**/resources/mobile/android/**/*"
		]
	},
	{
		files: ["**/*.ts"],
		ignores: ["**/*.spec.ts", "jest-global-mocks.ts"],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "script",
			globals: globals.browser,
			parserOptions: {
				project: ["tsconfig.json", "tsconfig.worker.json", "tsconfig.capacitor.json"],
				createDefaultProgram: true
			}
		},
		extends: [
			eslint.configs.recommended,
			...ts.configs.recommended,
			...ts.configs.stylistic,
			...angular.configs.tsRecommended,
			unicorn.configs.recommended,
			rxjsX.configs.recommended,
			stylistic.configs.recommended
		],
		processor: angular.processInlineTemplates,
		rules: {
			...commonRules,
			...commonStylisticRules,
			...commonTypeScriptRules,
			...commonUnicornRules,
			"@angular-eslint/component-max-inline-declarations": "error",
			"@angular-eslint/directive-selector": ["error", { type: "attribute", prefix: "app", style: "camelCase" }],
			"@angular-eslint/no-attribute-decorator": "error",
			"@angular-eslint/no-lifecycle-call": "error",
			"@angular-eslint/no-pipe-impure": "error",
			"@angular-eslint/no-queries-metadata-property": "error",
			"@angular-eslint/prefer-output-readonly": "error",
			"@angular-eslint/relative-url-prefix": "error",
			"@angular-eslint/use-component-view-encapsulation": "error"
		}
	},
	{
		files: ["**/*.spec.ts", "jest-global-mocks.ts"],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "script",
			globals: pluginJest.environments.globals.globals,
			parserOptions: {
				project: ["tsconfig.json", "tsconfig.worker.json"],
				createDefaultProgram: true
			}
		},
		extends: [
			eslint.configs.recommended,
			...ts.configs.recommended,
			...ts.configs.stylistic,
			...angular.configs.tsRecommended,
			unicorn.configs.recommended,
			stylistic.configs.recommended,
			pluginJest.configs["flat/recommended"]
		],
		rules: {
			...commonRules,
			...commonStylisticRules,
			...commonTypeScriptRules,
			...commonUnicornRules,
			"jest/no-disabled-tests": "warn",
			"jest/no-focused-tests": "error",
			"jest/no-identical-title": "error",
			"jest/prefer-to-have-length": "warn",
			"jest/valid-expect": "error",
			"jest/expect-expect": [
				"error",
				{
					"assertFunctionNames": [
						"expect", "expectNoBlankTiles", "expectWinnable", "expectNoBlankTiles"
					],
					"additionalTestBlockFunctions": []
				}
			]
		}
	},
	{
		files: ["**/*.html"],
		extends: [
			...angular.configs.templateRecommended,
			...angular.configs.templateAccessibility
		],
		rules: {
			"@angular-eslint/template/click-events-have-key-events": "off",
			"@angular-eslint/template/interactive-supports-focus": "off",
			"@angular-eslint/template/label-has-associated-control": "off"
		}
	},
	{
		files: ["**/*.{js,mjs,cjs}"],
		extends: [
			eslint.configs.recommended,
			unicorn.configs.recommended,
			stylistic.configs.recommended
		],
		languageOptions: {
			globals: globals.node
		},
		rules: {
			...commonRules,
			...commonStylisticRules,
			...commonUnicornRules,
			"@stylistic/quotes": ["error", "double"]
		}
	}
);
