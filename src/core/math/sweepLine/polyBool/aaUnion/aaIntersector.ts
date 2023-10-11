import { Intersector } from "../../classes/intersector";

import type { StartEvent } from "../../classes/event";

//=================================================================
/**
 * {@link AAIntersector} manages the intersection of AA line segments.
 */
//=================================================================

export class AAIntersector extends Intersector {

	/** Should we check for self-intersection of a polygon. */
	private _checkSelfIntersection: boolean;

	constructor(checkSelfIntersection: boolean) {
		super();
		this._checkSelfIntersection = checkSelfIntersection;
	}

	/**
	 * Find possible intersection between segments and
	 * subdivides existing segments, adding new events if necessary.
	 * @param ev1 The first segment (in the order of {@link _status}).
	 * @param ev2 The second segment (in the order of {@link _status}).
	 */
	public $possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void {
		if(!ev1 || !ev2) return;
		if(!this._checkSelfIntersection && ev1.$segment.$polygon === ev2.$segment.$polygon) return;
		this._processAALineSegments(ev1, ev2);
	}
}
