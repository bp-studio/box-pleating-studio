import { GeneratorUtil } from "core/utils/generator";
import { Configuration } from "../configuration";
import { clone } from "shared/utils/clone";

import type { JJunction, JOverlap, JStretch } from "shared/json";
import type { ValidJunction } from "../junction/validJunction";

export function* singleGenerator(junction: ValidJunction, prototype?: JStretch): Generator<Configuration> {
	const filter = (config: Configuration): boolean => config.$entry != null;
	const j = junction.toJSON();

	yield* GeneratorUtil.$first([
		singleGOPS(j),
	], filter);
}

function* singleGOPS(j: JJunction): Generator<Configuration> {
	yield new Configuration([{
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
