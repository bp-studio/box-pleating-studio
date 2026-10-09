import { GeneratorUtil } from "core/utils/generator";
import { createConfigFilter } from "./filters";
import { GadgetStrategy } from "shared/json";

import type { Configuration } from "../configuration";
import type { ConfigGeneratorContext } from "./configGeneratorContext";
import type { JJunction, JOverlap, JPartition } from "shared/json";
import type { Repository } from "../repository";

//=================================================================
/**
 * {@link singleConfigGenerator} is a {@link Configuration} {@link Generator}
 * that works for a single {@link JJunction}.
 *
 * @param index The index within {@link Repository.$junctions} to be processed.
 */
//=================================================================

export function* singleConfigGenerator(
	context: ConfigGeneratorContext, index: number, protoSignature?: string
): Generator<Configuration> {
	yield* GeneratorUtil.$first([
		singleGadget(context, index),
		doubleRelay(context, index),
		singleGadget(context, index, GadgetStrategy.halfIntegral),
		singleGadget(context, index, GadgetStrategy.universal),
	], createConfigFilter(protoSignature));
}

function* singleGadget(
	context: ConfigGeneratorContext, index: number, gadget?: GadgetStrategy
): Generator<Configuration> {
	const j = context.$repo.$junctions[index];
	const overlap = context.$toOverlap(j, index);
	if(gadget) overlap.gadget = gadget;
	const partitions: JPartition[] = [{ overlaps: [overlap] }];
	yield context.$make(partitions, true);
}

function* doubleRelay(
	context: ConfigGeneratorContext, index: number
): Generator<Configuration> {
	const j = context.$repo.$junctions[index];
	const make = (overlaps: JOverlap[]): Configuration =>
		context.$make(overlaps.map(o => ({ overlaps: [o] })), true);

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
