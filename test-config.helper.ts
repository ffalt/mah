// eslint-disable-next-line import/no-internal-modules
import {TestBed} from '@angular/core/testing';

type CompilerOptions = Partial<{
	providers: Array<any>;
	useJit: boolean;
	preserveWhitespaces: boolean;
}>;
export type ConfigureFn = (testBed: typeof TestBed) => void;

export const configureTests = async (
	configure: ConfigureFn,
	compilerOptions: CompilerOptions = {}
) => {
	const compilerConfig: CompilerOptions = {
		preserveWhitespaces: false,
		...compilerOptions
	};

	const configuredTestBed = TestBed.configureCompiler(compilerConfig);

	configure(configuredTestBed);

	return configuredTestBed.compileComponents().then(() => configuredTestBed);
};
