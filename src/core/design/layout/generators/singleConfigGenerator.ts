import { GeneratorUtil } from "core/utils/generator";
import { createConfigFilter } from "./filters";
import { Strategy } from "shared/json";

import type { Configuration } from "../configuration";
import type { ConfigGeneratorContext } from "./configGeneratorContext";
import type { JJunction, JOverlap, JPartition } from "shared/json";

//=================================================================
/**
 * {@link singleConfigGenerator} is a {@link Configuration} {@link Generator}
 * that works for a single {@link JJunction}.
 */
//=================================================================
export function* singleConfigGenerator(
	context: ConfigGeneratorContext, junction: JJunction, protoSignature?: string
): Generator<Configuration> {
	yield* GeneratorUtil.$first([
		singleGadget(context, junction),
		doubleRelay(context, junction),
		singleGadget(context, junction, Strategy.halfIntegral),
		singleGadget(context, junction, Strategy.universal),
	], createConfigFilter(protoSignature));
}

function* singleGadget(context: ConfigGeneratorContext, j: JJunction, strategy?: Strategy): Generator<Configuration> {
	const partitions: JPartition[] = [{
		overlaps: [context.$toOverlap(j, 0)],
		strategy,
	}];
	yield context.$make(partitions, [j]);
}

function* doubleRelay(context: ConfigGeneratorContext, j: JJunction, index: number = 0): Generator<Configuration> {
	const make = (overlaps: JOverlap[]): Configuration =>
		context.$make(overlaps.map(o => ({ overlaps: [o] })), [j]);

	if(j.ox * j.oy % 2) return; // Odd area won't work
	if(j.ox < j.oy) {
		for(let y = 1; y <= j.oy / 2; y++) {
			const c = make(context.$cut(j, index, 0, y));
			if(c.$pattern) {
				yield c;
				yield make(context.$cut(j, index, 0, j.oy - y));
			}
		}
	} else {
		for(let x = 1; x <= j.ox / 2; x++) {
			const c = make(context.$cut(j, index, x, 0));
			if(c.$pattern) {
				yield c;
				yield make(context.$cut(j, index, j.ox - x, 0));
			}
		}
	}
}
