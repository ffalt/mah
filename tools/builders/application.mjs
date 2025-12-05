import { createBuilder } from "@angular-devkit/architect";
import { buildApplication } from "@angular/build";
import { mahBuild } from "./mah-builder.mjs";

async function* execute(options, context) {
	const { define, extensions } = mahBuild(options, context);
	const mergedOptions = { ...options, define };
	for await (const result of buildApplication(mergedOptions, context, extensions)) {
		yield result;
	}
}

export default createBuilder(execute);
