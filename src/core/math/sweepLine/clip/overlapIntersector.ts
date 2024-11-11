import { GeneralIntersector } from "../polyBool/generalUnion/generalIntersector";

import type { LineSegment } from "../classes/segment/lineSegment";
import type { StartEvent } from "../classes/event/startEvent";

//=================================================================
/**
 * {@link OverlapIntersector} is a special intersector that stops immediately
 * once an cross intersection is found.
 */
//=================================================================
export class OverlapIntersector extends GeneralIntersector {

	public $found: boolean = false;

	public override $possibleIntersection(ev1?: StartEvent | undefined, ev2?: StartEvent | undefined): void {
		// v0.6.17: we add this check to avoid false intersection detection due to floating error,
		// which seems difficult to overcome otherwise.
		if(ev1 && ev2 && ev1.$segment.$polygon == ev2.$segment.$polygon) return;
		super.$possibleIntersection(ev1, ev2);
	}

	protected override _crossIntersection(ev1: StartEvent, ev2: StartEvent, pt: IPoint): void {
		const seg1 = ev1.$segment as LineSegment;
		const seg2 = ev2.$segment as LineSegment;
		// v0.7.0: Intersecting at endpoints does not count for either segment
		if(seg1.$containsPtOnLine(pt, false) && seg2.$containsPtOnLine(pt, false)) this.$found = true;
	}
}
