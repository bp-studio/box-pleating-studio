import { singleConfigGenerator } from "./singleConfigGenerator";
import { GeneratorUtil } from "core/utils/generator";
import { configFilter } from "./filters";

import type { Repository } from "../repository";
import type { Configuration } from "../configuration";
import type { ValidJunction } from "../junction/validJunction";

//=================================================================
/**
 * {@link generalConfigGenerator} is a {@link Configuration} {@link Generator}
 * that works for multiple {@link ValidJunction}s in general.
 */
//=================================================================
export function* generalConfigGenerator(
	repo: Repository, junctions: ValidJunction[], seedSignature?: string
): Generator<Configuration> {
	// TODO
	// First find all possible configurations for each Junction
	const junctionConfigs = junctions.map(j => [...singleConfigGenerator(repo, j)]);

	yield* GeneratorUtil.$first([

	], configFilter(undefined));
}
