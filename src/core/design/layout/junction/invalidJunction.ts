import { RRIntersection } from "core/math/sweepLine/polyBool/rrIntersection/rrIntersection";

import type { ArcPolygon } from "shared/types/geometry";
import type { ITreeNode } from "core/design/context";
import type { invalidJunctionTask } from "../../tasks/invalidJunction";

const intersection = new RRIntersection();

//=================================================================
/**
 * {@link InvalidJunction} represents an invalid overlapping of flaps.
 */
//=================================================================

export class InvalidJunction {

	/** The first flap. */
	public readonly $a: ITreeNode;

	/** The second flap. */
	public readonly $b: ITreeNode;

	public readonly $valid = false;

	/** If the same {@link InvalidJunction} has already been drawn. */
	public $processed: boolean = false;

	/** Distance between two flaps. */
	private readonly _dist: number;

	constructor(a: ITreeNode, b: ITreeNode, d: number) {
		this.$a = a;
		this.$b = b;
		this._dist = d - a.$length - b.$length;
	}

	/**
	 * Calculates and returns the {@link ArcPolygon} region of the invalid overlapping.
	 *
	 * Of course we could also perform this calculation in the constructor,
	 * but we deliberately perform this in {@link invalidJunctionTask},
	 * so that we may observe its performance.
	 */
	public $getPolygon(): ArcPolygon {
		const A = this.$a.$AABB, B = this.$b.$AABB;
		const result = intersection.$get(A.$toRoundedRect(0), B.$toRoundedRect(this._dist));
		if(this._dist > 0) result.push(...intersection.$get(A.$toRoundedRect(this._dist), B.$toRoundedRect(0)));

		this.$processed = true;
		return result;
	}
}
