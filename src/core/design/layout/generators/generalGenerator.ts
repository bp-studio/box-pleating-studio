import { singleGenerator } from "./singleGenerator";
import { GeneratorUtil } from "core/utils/generator";

import type { Configuration } from "../configuration";
import type { JStretch } from "shared/json";
import type { ValidJunction } from "../junction/validJunction";

export function* generalGenerator(junctions: ValidJunction[], prototype?: JStretch): Generator<Configuration> {
	// First find all possible configurations for each Junction
	const junctionConfigs = junctions.map(j => [...singleGenerator(j)]);

	const filter = (config: Configuration): boolean => config.$entry != null;
	yield* GeneratorUtil.$first([

	], filter);
}
