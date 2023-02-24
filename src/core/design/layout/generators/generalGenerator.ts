import { singleGenerator } from "./singleGenerator";
import { GeneratorUtil } from "core/utils/generator";
import { configFilter } from "./filters";

import type { Configuration } from "../configuration";
import type { JStretch } from "shared/json";
import type { ValidJunction } from "../junction/validJunction";

//=================================================================
/**
 * {@link generalGenerator} is a {@link Configuration} {@link Generator}
 * that works for multiple {@link ValidJunction}s in general.
 */
//=================================================================
export function* generalGenerator(junctions: ValidJunction[], prototype?: JStretch): Generator<Configuration> {
	// First find all possible configurations for each Junction
	const junctionConfigs = junctions.map(j => [...singleGenerator(j)]);

	yield* GeneratorUtil.$first([

	], configFilter);
}
