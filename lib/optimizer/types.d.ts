/// <reference types="emscripten" />

export interface OptimizerInstance extends EmscriptenModule {
	_init(async: boolean): void;
	_solve(ptr: number): number;
	ccall: typeof ccall;
}

export type OptimizerInit = Partial<EmscriptenModule> & OtherKeys<EmscriptenModule, unknown>;

export interface OptimizerFactory {
	(options?: OptimizerInit): Promise<OptimizerInstance>;
}
