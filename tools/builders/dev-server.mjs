// eslint-disable-next-line unicorn/prevent-abbreviations
import { createBuilder } from "@angular-devkit/architect";
import { executeDevServerBuilder } from "@angular/build";
import { mahBuild } from "./mah-builder.mjs";

async function* execute(options, context) {
	const { extensions } = mahBuild(options, context);
	for await (const result of executeDevServerBuilder(options, context, extensions)) {
		yield result;
	}
}

export default createBuilder(execute);
