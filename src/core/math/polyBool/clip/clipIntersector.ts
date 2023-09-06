import { Intersector } from "../intersector";
import { EPSILON } from "../segment/arcSegment";

import type { LineSegment } from "../segment/lineSegment";
import type { StartEvent } from "../event";
import type { Clip } from "./clip";
import type { OverlapIntersector } from "../overlap/overlapIntersector";

//=================================================================
/**
 * {@link ClipIntersector} is the {@link Intersector} used in {@link Clip}.
 * It finds intersections of general line segments.
 */
//=================================================================

export class ClipIntersector extends Intersector {

	public $possibleIntersection(ev1?: StartEvent | undefined, ev2?: StartEvent | undefined): void {
		if(!ev1 || !ev2) return;
		const seg1 = ev1.$segment as LineSegment;
		const seg2 = ev2.$segment as LineSegment;

		const [a1, b1, c1] = seg1.$coefficients, [a2, b2, c2] = seg2.$coefficients;
		const detAB = a1 * b2 - a2 * b1;
		const detBC = b1 * c2 - b2 * c1;
		if(Math.abs(detAB) < EPSILON) {
			// Parallel case
			if(Math.abs(detBC) > EPSILON) return; // Different lines.

			// We know that ev1 and ev2 are sorted
			const p2 = ev1.$other.$point;
			const p3 = ev2.$point, p4 = ev2.$other.$point;
			if(seg1.$containsPtOnLine(p3, false)) ev1 = this._subdivide(ev1, p3);
			if(seg1.$containsPtOnLine(p4, false)) this._subdivide(ev1, p4);
			if(seg2.$containsPtOnLine(p2, false)) this._subdivide(ev2, p2);
		} else {
			// Crossing case
			const pt: IPoint = { x: detBC / detAB, y: (a2 * c1 - a1 * c2) / detAB };
			if(seg1.$containsPtOnLine(pt, false) && seg2.$containsPtOnLine(pt, true)) this._crossSubdivide(ev1, pt);
			if(seg2.$containsPtOnLine(pt, false) && seg1.$containsPtOnLine(pt, true)) this._crossSubdivide(ev2, pt);
		}
	}

	/** This method is overwritten in {@link OverlapIntersector}. */
	protected _crossSubdivide(event: StartEvent, point: IPoint): void {
		this._subdivide(event, point);
	}
}
