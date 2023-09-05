import { GeneratorUtil } from "core/utils/generator";
import { Configuration } from "../configuration";
import { clone } from "shared/utils/clone";
import { configFilter } from "./filters";
import { ConfigUtil } from "./configUtil";
import { Strategy } from "shared/json";

import type { JJunction, JOverlap, JPartition } from "shared/json";
import type { Repository } from "../repository";
import type { ValidJunction } from "../junction/validJunction";

//=================================================================
/**
 * {@link singleConfigGenerator} is a {@link Configuration} {@link Generator}
 * that works for a single {@link ValidJunction}.
 */
//=================================================================
export function* singleConfigGenerator(
	repo: Repository, junction: ValidJunction, protoSignature?: string
): Generator<Configuration> {
	const j = junction.toJSON();
	yield* GeneratorUtil.$first([
		singleGadget(repo, j),
		doubleRelay(repo, j),
		singleGadget(repo, j, Strategy.halfIntegral),
		singleGadget(repo, j, Strategy.universal),
	], configFilter(protoSignature));
}

function* singleGadget(repo: Repository, j: JJunction, strategy?: Strategy): Generator<Configuration> {
	const partitions: JPartition[] = [{
		overlaps: [toOverlap(j, 0)],
		strategy,
	}];
	yield new Configuration(repo, [j], { partitions });
}

function* doubleRelay(repo: Repository, j: JJunction, index: number = 0): Generator<Configuration> {
	if(j.ox * j.oy % 2) return; // Odd area won't work
	if(j.ox < j.oy) {
		for(let y = 1; y <= j.oy / 2; y++) {
			const c = new Configuration(
				repo, [j],
				{ partitions: ConfigUtil.$cut(j, index, -1, 0, y) }
			);
			if(c.$pattern) {
				yield c;
				yield new Configuration(
					repo, [j],
					{ partitions: ConfigUtil.$cut(j, index, -1, 0, j.oy - y) }
				);
			}
		}
	} else {
		for(let x = 1; x <= j.ox / 2; x++) {
			const c = new Configuration(
				repo, [j],
				{ partitions: ConfigUtil.$cut(j, index, -1, x, 0) }
			);
			if(c.$pattern) {
				yield c;
				yield new Configuration(
					repo, [j],
					{ partitions: ConfigUtil.$cut(j, index, -1, j.ox - x, 0) }
				);
			}
		}
	}
}

function toOverlap(j: JJunction, parentIndex: number): JOverlap {
	return {
		c: clone(j.c),
		ox: j.ox,
		oy: j.oy,
		parent: parentIndex,
	};
}
