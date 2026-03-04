import { Intersector } from "../../classes/intersector";
import { epsilonSame, isAlmostZero } from "core/math/geometry/float";

import type { LineSegment } from "../../classes/segment/lineSegment";
import type { StartEvent } from "../../classes/event";
import type { OverlapIntersector } from "../../clip/overlapIntersector";

/**
 * A relaxed epsilon (larger than the default {@link EPSILON}) used in two places:
 * 1. Parallel-line detection: since {@link LineSegment.$coefficients} are not
 *    normalized, their cross products can amplify floating errors beyond EPSILON.
 * 2. Subdivision guard: prevents creating near-degenerate segments whose
 *    unreliable slope calculations would make the status BST comparator
 *    inconsistent, ultimately leading to lookup failures.
 */
const RELAXED_EPSILON = 1e-9;

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
			// Parallel case.
			// A relaxed epsilon is needed here because $coefficients are not
			// normalized (their magnitude scales with segment length), so
			// detBC can accumulate floating errors larger than EPSILON
			// when the segments have non-trivial length.
			if(!isAlmostZero(detBC, RELAXED_EPSILON)) return; // Different lines.

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
		if(
			epsilonSame(point, event.$point, RELAXED_EPSILON) ||
			epsilonSame(point, event.$other.$point, RELAXED_EPSILON)
		) {
			// Skip subdivision when the split point is too close to either endpoint.
			// Creating near-degenerate segments leads to unreliable slope values,
			// causing the status BST comparator to become inconsistent and
			// failing to locate nodes during $getPrev/$getNext lookups.
			return event;
		}
		return super._subdivide(event, point);
	}
}
