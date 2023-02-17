import type { JOverlap, JPartition } from "shared/json";
import type { Configuration } from "./configuration";

//=================================================================
/**
 * {@link Partition} is a single unit under {@link Configuration}.
 * {@link Partition} corresponds to a single {@link Device}.
 */
//=================================================================

export class Partition {

	public readonly $overlaps: readonly JOverlap[];

	constructor(data: JPartition) {
		this.$overlaps = data.overlaps;
	}
}
