/// <reference types="emscripten" />
/// <reference path="../../src/shared/types/utility.d.ts" />

export interface OptimizerInstance extends EmscriptenModule {
	_init(async: boolean): void;
	ccall: typeof ccall;
}

export type OptimizerInit = Partial<EmscriptenModule> & OtherKeys<EmscriptenModule, unknown>;

export interface OptimizerFactory {
	(options?: OptimizerInit): Promise<OptimizerInstance>;
}
