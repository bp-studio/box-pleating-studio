import { GeneratorUtil } from "core/utils/generator";
import { Configuration } from "../configuration";
import { clone } from "shared/utils/clone";
import { configFilter } from "./filters";

import type { Repository } from "../repository";
import type { JJunction, JOverlap, JPartition } from "shared/json";
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
	// TODO
	yield* GeneratorUtil.$first([
		singleGOPS(repo, j),
	], configFilter(protoSignature));
}

function* singleGOPS(repo: Repository, j: JJunction): Generator<Configuration> {
	const partitions: JPartition[] = [{
		overlaps: [toOverlap(j, 0)],
	}];
	yield new Configuration(repo, [j], { partitions });
}

function toOverlap(j: JJunction, parentIndex: number): JOverlap {
	return {
		c: clone(j.c),
		ox: j.ox,
		oy: j.oy,
		parent: parentIndex,
	};
}
