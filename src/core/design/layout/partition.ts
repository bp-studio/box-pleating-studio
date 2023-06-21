import { Store } from "./store";
import { $generate } from "core/math/gops";
import { CornerType } from "shared/json";
import { cache } from "core/utils/cache";

import type { JConnection, JDevice, JGadget, JJunction, JOverlap, JPartition, JCorner } from "shared/json";
import type { Pattern } from "./pattern/pattern";
import type { Configuration } from "./configuration";
import type { Vector } from "core/math/geometry/vector";

interface CornerMap {
	/** {@link JCorner} itself. */
	corner: JCorner;

	/** Which {@link Overlap} in the {@link Partition}  */
	overlapIndex: number;

	/** Which {@link Anchor} in the {@link Overlap}. */
	anchorIndex: number;
}

//=================================================================
/**
 * {@link Partition} is a single unit under {@link Configuration}.
 * {@link Partition} corresponds to a single {@link Device}.
 */
//=================================================================

export class Partition implements ISerializable<JPartition> {

	public readonly $cornerMap: readonly CornerMap[];
	public readonly $overlaps: readonly JOverlap[];

	/**
	 * Available {@link JDevice} for this {@link Partition}.
	 * They will be assembled into {@link Pattern}.
	 */
	public readonly $devices: Store<JDevice>;

	constructor(junctions: JJunction[], data: JPartition) {
		this.$overlaps = data.overlaps;
		this.$devices = new Store(this._deviceGenerator(junctions));

		// Gather all corners
		const map: CornerMap[] = [];
		for(const [i, o] of data.overlaps.entries()) {
			for(const [j, c] of o.c.entries()) {
				map.push({ corner: c, overlapIndex: i, anchorIndex: j });
			}
		}
		this.$cornerMap = map;
	}

	public toJSON(): JPartition {
		return { overlaps: this.$overlaps };
	}

	public $getOriginalDisplacement(pattern: Pattern): Vector {
		// Arbitrarily choose an outward connection point in this Partition; doesn't matter which.
		const overlap = this.$overlaps.find(o => o.c[0].type != CornerType.coincide)!;
		return pattern.$getConnectionTarget(overlap.c[0] as JConnection)
			.sub(pattern.$config.$repo.$origin);
	}

	/** All {@link JCorner}s that are dragging constraints of the current {@link Partition}. */
	@cache public get $constraints(): readonly CornerMap[] {
		return this.$cornerMap.filter(m => {
			const type = m.corner.type;
			return type == CornerType.socket ||
				type == CornerType.internal ||
				type == CornerType.flap;
		});
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private *_deviceGenerator(junctions: JJunction[]): Generator<JDevice> {
		if(this.$overlaps.length == 1) {
			const overlap = this.$overlaps[0];
			const { ox, oy } = overlap;
			const sx = junctions[overlap.parent].sx;
			for(const piece of $generate(ox, oy, sx)) {
				const gadget: JGadget = { pieces: [piece] };
				yield { gadgets: [gadget] };
			}
		}
	}
}
