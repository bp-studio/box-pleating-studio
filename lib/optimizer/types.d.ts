/// <reference types="emscripten" />
/// <reference path="../../src/shared/types/utility.d.ts" />

export interface OptimizerInstance extends EmscriptenModule {
	init(async: boolean): void;

	solve(data: object, seed: number): Awaitable<EmVector>;
}

interface EmVector<T = number> {
	size(): number;
	get(i: number): T;
	delete(): void;
}

export type OptimizerInit = Partial<EmscriptenModule> & OtherKeys<EmscriptenModule, unknown>;

export interface OptimizerFactory {
	(options?: OptimizerInit): Promise<OptimizerInstance>;
}
