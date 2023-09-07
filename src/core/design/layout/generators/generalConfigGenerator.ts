import { GeneratorUtil } from "core/utils/generator";
import { createConfigFilter } from "./filters";
import { GeneralConfigGeneratorContext } from "./generalConfigGeneratorContext";

import type { JJunctions } from "shared/json";
import type { Repository } from "../repository";
import type { Configuration } from "../configuration";

//=================================================================
/**
 * {@link generalConfigGenerator} is a {@link Configuration} {@link Generator}
 * that works for multiple {@link JJunction}s in general.
 */
//=================================================================
export function* generalConfigGenerator(repo: Repository, protoSignature?: string): Generator<Configuration> {
	// First find all possible configurations for each Junction
	const context = new GeneralConfigGeneratorContext(repo);
	if(!context.$valid) return;

	const generators: Generator<Configuration>[] = [];
	for(let rank = 0; rank <= context.$maxRank; rank++) {
		generators.push(generateConfig(context, rank));
	}
	yield* GeneratorUtil.$first(generators, createConfigFilter(protoSignature));
}

function* generateConfig(context: GeneralConfigGeneratorContext, targetRank: number): Generator<Configuration> {
	for(const combination of context.$rankCombination(targetRank)) {
		yield* context.$search(combination);
	}
}
