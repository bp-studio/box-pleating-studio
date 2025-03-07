import { Intersector } from "../../classes/intersector";
import { epsilonSame, isAlmostZero } from "core/math/geometry/float";

import type { LineSegment } from "../../classes/segment/lineSegment";
import type { StartEvent } from "../../classes/event";
import type { OverlapIntersector } from "../../clip/overlapIntersector";

/** Experiments showed that the epsilon here needs to be slightly relaxed. */
const PARALLEL_EPSILON = 1e-9;

//=================================================================
/**
 * {@link GeneralIntersector} is the {@link Intersector} for general line segments.
 */
//=================================================================

export class GeneralIntersector extends Intersector {

	public $possibleIntersection(ev1?: StartEvent | undefined, ev2?: StartEvent | undefined): void {
		if(!ev1 || !ev2) return;
		const seg1 = ev1.$segment as LineSegment;
		const seg2 = ev2.$segment as LineSegment;

		const [a1, b1, c1] = seg1.$coefficients, [a2, b2, c2] = seg2.$coefficients;
		const detAB = a1 * b2 - a2 * b1;
		const detBC = b1 * c2 - b2 * c1;
		if(isAlmostZero(detAB)) {
			// Parallel case
			if(!isAlmostZero(detBC, PARALLEL_EPSILON)) return; // Different lines.

			// We know that ev1 and ev2 are sorted
			const p2 = ev1.$other.$point;
			const p3 = ev2.$point, p4 = ev2.$other.$point;
			if(seg1.$containsPtOnLine(p3, false)) ev1 = this._subdivide(ev1, p3);
			if(seg1.$containsPtOnLine(p4, false)) this._subdivide(ev1, p4);
			if(seg2.$containsPtOnLine(p2, false)) this._subdivide(ev2, p2);
		} else {
			// Crossing case
			const pt: IPoint = { x: detBC / detAB, y: (a2 * c1 - a1 * c2) / detAB };
			this._crossIntersection(ev1, ev2, pt);
		}
	}

	/** This method is overwritten in {@link OverlapIntersector}. */
	protected _crossIntersection(ev1: StartEvent, ev2: StartEvent, pt: IPoint): void {
		const seg1 = ev1.$segment as LineSegment;
		const seg2 = ev2.$segment as LineSegment;
		if(seg1.$containsPtOnLine(pt, false) && seg2.$containsPtOnLine(pt, true)) this._subdivide(ev1, pt);
		if(seg2.$containsPtOnLine(pt, false) && seg1.$containsPtOnLine(pt, true)) this._subdivide(ev2, pt);
	}

	protected override _subdivide(event: StartEvent, point: IPoint): StartEvent {
		if(epsilonSame(point, event.$point) || epsilonSame(point, event.$other.$point)) {
			// No need to subdivide in this case. It is known that creating essentially
			// degenerated segments could lead to error in ordering the events.
			return event;
		}
		return super._subdivide(event, point);
	}
}
