import { Intersector } from "../intersector";
import { SegmentType } from "../segment/segment";
import { EPSILON } from "../segment/arcSegment";
import { leg } from "shared/types/geometry";

import type { ArcSegment } from "../segment/arcSegment";
import type { AALineSegment } from "../segment/aaLineSegment";
import type { StartEvent } from "../event";

export type Segment = AALineSegment | ArcSegment;

//=================================================================
/**
 * {@link RRIntersector} manages the intersection of segments.
 */
//=================================================================

export class RRIntersector extends Intersector {

	/**
	 * Find possible intersection between segments and
	 * subdivides existing segments, adding new events if necessary.
	 * @param ev1 The first segment (in the order of {@link _status}).
	 * @param ev2 The second segment (in the order of {@link _status}).
	 */
	public $possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void {
		if(!ev1 || !ev2) return;
		const seg1 = ev1.$segment as Segment;
		const seg2 = ev2.$segment as Segment;
		if(seg1.$polygon === seg2.$polygon) return;

		if(seg1.$type === seg2.$type) {
			if(seg1.$type === SegmentType.AALine) this._processAALineSegments(ev1, ev2);
			else this._processArcSegments(ev1, ev2);
		} else {
			if(seg1.$type === SegmentType.AALine) this._processArcVsAALine(ev2, ev1);
			else this._processArcVsAALine(ev1, ev2);
		}
	}

	/** Process the intersection between two arcs. */
	private _processArcSegments(ev1: StartEvent, ev2: StartEvent): void {
		let seg1 = ev1.$segment as ArcSegment;
		let seg2 = ev2.$segment as ArcSegment;
		const intersections = seg1.$intersection(seg2);
		for(let p of intersections) { // Already sorted
			p = fix(fix(p, seg1), seg2);
			const in1 = seg1.$inArcRange(p), in2 = seg2.$inArcRange(p);
			// The condition for intersection is:
			// it in the interior of self, and at least at the endpoint of the other.
			if(in1 < -EPSILON && in2 < EPSILON) {
				ev1 = this._subdivide(ev1, p);
				seg1 = ev1.$segment as ArcSegment;
			}
			if(in1 < EPSILON && in2 < -EPSILON) {
				ev2 = this._subdivide(ev2, p);
				seg2 = ev2.$segment as ArcSegment;
			}
		}
	}

	/** Process the intersection of an arc and an AA line segment. */
	private _processArcVsAALine(eArc: StartEvent, eLine: StartEvent): void {
		const arc = eArc.$segment as ArcSegment;
		const line = eLine.$segment as AALineSegment;
		if(line.$isHorizontal) {
			const y = line.$start.y;
			const da = (y - arc.$start.y) * (y - arc.$end.y);
			if(da > EPSILON) return;
			const r = arc.$radius;
			const dy = y - arc.$center.y;
			const dx = leg(r, dy);
			const x = arc.$center.x + (arc.$start.y > arc.$end.y ? -dx : dx);
			const p = fix(fix({ x, y }, line), arc);
			const dl = (x - eLine.$point.x) * (x - eLine.$other.$point.x);
			if(da < -EPSILON && dl < EPSILON) this._subdivide(eArc, p);
			if(da < EPSILON && dl < -EPSILON) this._subdivide(eLine, p);
		} else {
			const x = line.$start.x;
			const da = (x - arc.$start.x) * (x - arc.$end.x);
			if(da > EPSILON) return;
			const y = yIntercept(arc, x);
			const p = fix(fix({ x, y }, line), arc);
			const dl = (y - eLine.$point.y) * (y - eLine.$other.$point.y);
			if(da < -EPSILON && dl < EPSILON) this._subdivide(eArc, p);
			if(da < EPSILON && dl < -EPSILON) this._subdivide(eLine, p);
		}
	}
}

/**
 * The y-intercept of an arc at the given x-coordinate.
 * This is also used in event comparison.
 */
export function yIntercept(arc: ArcSegment, x: number): number {
	const r = arc.$radius;
	const dx = x - arc.$center.x;
	const dy = leg(r, dx);
	return arc.$center.y + (arc.$start.x > arc.$end.x ? dy : -dy);
}

/** Check if the two points are essentially equal under {@link EPSILON}-comparison. */
export function same(p1: IPoint, p2: IPoint): boolean {
	return Math.abs(p1.x - p2.x) < EPSILON && Math.abs(p1.y - p2.y) < EPSILON;
}

/**
 * If the intersection is essentially an endpoint of the segment,
 * returns the original endpoint to avoid sorting error.
 */
export function fix(p: IPoint, seg: Segment): IPoint {
	if(same(p, seg.$start)) return seg.$start;
	if(same(p, seg.$end)) return seg.$end;
	return p;
}
