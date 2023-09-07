import { GeneratorUtil } from "core/utils/generator";
import { Configuration } from "../configuration";
import { createConfigFilter } from "./filters";
import { ConfigUtil } from "./configUtil";
import { Strategy } from "shared/json";

import type { JJunction, JPartition } from "shared/json";
import type { Repository } from "../repository";

//=================================================================
/**
 * {@link singleConfigGenerator} is a {@link Configuration} {@link Generator}
 * that works for a single {@link JJunction}.
 */
//=================================================================
export function* singleConfigGenerator(
	repo: Repository, junction: JJunction, protoSignature?: string
): Generator<Configuration> {
	yield* GeneratorUtil.$first([
		singleGadget(repo, junction),
		doubleRelay(repo, junction),
		singleGadget(repo, junction, Strategy.halfIntegral),
		singleGadget(repo, junction, Strategy.universal),
	], createConfigFilter(protoSignature));
}

function* singleGadget(repo: Repository, j: JJunction, strategy?: Strategy): Generator<Configuration> {
	const partitions: JPartition[] = [{
		overlaps: [ConfigUtil.$toOverlap(j, 0)],
		strategy,
	}];
	yield new Configuration(repo, { partitions }, [j]);
}

function* doubleRelay(repo: Repository, j: JJunction, index: number = 0): Generator<Configuration> {
	if(j.ox * j.oy % 2) return; // Odd area won't work
	if(j.ox < j.oy) {
		for(let y = 1; y <= j.oy / 2; y++) {
			const c = new Configuration(
				repo, { partitions: ConfigUtil.$cut(j, index, -1, 0, y) }, [j]
			);
			if(c.$pattern) {
				yield c;
				yield new Configuration(
					repo, { partitions: ConfigUtil.$cut(j, index, -1, 0, j.oy - y) }, [j]
				);
			}
		}
	} else {
		for(let x = 1; x <= j.ox / 2; x++) {
			const c = new Configuration(
				repo, { partitions: ConfigUtil.$cut(j, index, -1, x, 0) }, [j]
			);
			if(c.$pattern) {
				yield c;
				yield new Configuration(
					repo, { partitions: ConfigUtil.$cut(j, index, -1, j.ox - x, 0) }, [j]
				);
			}
		}
	}
}
