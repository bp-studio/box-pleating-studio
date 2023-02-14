import type { JOverlap, JPartition } from "shared/json";

//=================================================================
/**
 * {@link Partition} 是 {@link Configuration} 底下的單一切割。
 * {@link Partition} 只會對應於單一的 {@link Device}。
 */
//=================================================================

export class Partition {

	public readonly $overlaps: readonly JOverlap[];

	constructor(data: JPartition) {
		this.$overlaps = data.overlaps;
	}
}
