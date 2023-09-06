import { GeneratorUtil } from "core/utils/generator";
import { configFilter } from "./filters";
import { GeneralConfigGeneratorContext } from "./generalConfigGeneratorContext";

import type { Repository } from "../repository";
import type { Configuration } from "../configuration";
import type { ValidJunction, Junctions } from "../junction/validJunction";

//=================================================================
/**
 * {@link generalConfigGenerator} is a {@link Configuration} {@link Generator}
 * that works for multiple {@link ValidJunction}s in general.
 */
//=================================================================
export function* generalConfigGenerator(
	repo: Repository, junctions: Junctions, protoSignature?: string
): Generator<Configuration> {
	// First find all possible configurations for each Junction
	const context = new GeneralConfigGeneratorContext(repo, junctions);
	if(!context.$valid) return;

	const generators: Generator<Configuration>[] = [];
	for(let rank = 0; rank <= context.$maxRank; rank++) {
		generators.push(generateConfig(context, rank));
	}
	yield* GeneratorUtil.$first(generators, configFilter(protoSignature));
}

function* generateConfig(context: GeneralConfigGeneratorContext, targetRank: number): Generator<Configuration> {
	for(const combination of context.$rankCombination(targetRank)) {
		yield* context.$search(combination);
	}
}
