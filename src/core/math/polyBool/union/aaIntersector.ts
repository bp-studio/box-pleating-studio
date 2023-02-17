import { Intersector } from "../intersector";

import type { StartEvent } from "../event";

//=================================================================
/**
 * {@link AAIntersector} manages the intersection of AA line segments.
 */
//=================================================================

export class AAIntersector extends Intersector {

	/** Should we check for self-intersection of a polygon. */
	public $checkSelfIntersection: boolean = false;

	/**
	 * Find possible intersection between segments and
	 * subdivides existing segments, adding new events if necessary.
	 * @param ev1 The first segment (in the order of {@link _status}).
	 * @param ev2 The second segment (in the order of {@link _status}).
	 */
	protected _possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void {
		if(!ev1 || !ev2) return;
		if(!this.$checkSelfIntersection && ev1.$segment.$polygon === ev2.$segment.$polygon) return;
		this._processAALineSegments(ev1, ev2);
	}
}
