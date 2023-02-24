import { GeneratorUtil } from "core/utils/generator";
import { Configuration } from "../configuration";
import { clone } from "shared/utils/clone";
import { configFilter } from "./filters";

import type { JJunction, JOverlap, JStretch } from "shared/json";
import type { ValidJunction } from "../junction/validJunction";

//=================================================================
/**
 * {@link singleGenerator} is a {@link Configuration} {@link Generator}
 * that works for a single {@link ValidJunction}.
 */
//=================================================================
export function* singleGenerator(junction: ValidJunction, prototype?: JStretch): Generator<Configuration> {
	const j = junction.toJSON();

	yield* GeneratorUtil.$first([
		singleGOPS(j),
	], configFilter);
}

function* singleGOPS(j: JJunction): Generator<Configuration> {
	yield new Configuration([j], [{
		overlaps: [toOverlap(j, 0)],
	}]);
}

function toOverlap(j: JJunction, index: number): JOverlap {
	return {
		c: clone(j.c),
		ox: j.ox,
		oy: j.oy,
		parent: index,
	};
}
