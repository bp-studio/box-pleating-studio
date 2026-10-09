import { Intersector } from "../../classes/intersector";
import { epsilonSame, floatXyComparator, isAlmostZero } from "core/math/geometry/float";

import type { LineSegment } from "../../classes/segment/lineSegment";
import type { StartEvent } from "../../classes/event";
import type { OverlapIntersector } from "../../clip/overlapIntersector";

/**
 * A relaxed epsilon (larger than the default {@link EPSILON}) used in two
 * places:
 * 1. Collinearity detection: the distances from the endpoints of a segment to
 *    the line of another carry the floating errors of both.
 * 2. Subdivision guard: prevents creating near-degenerate segments whose
 *    unreliable slope calculations would make the status BST comparator
 *    inconsistent, ultimately leading to lookup failures.
 *
 * The 10x factor over EPSILON is sufficient for both use cases and
 * remains negligible relative to the coordinate scale of this application.
 */
const RELAXED_EPSILON = 1e-9;

/**
 * Whether the segment of the second event lies on the line of the first one,
 * that is, both of its endpoints are within {@link RELAXED_EPSILON} from the
 * line.
 *
 * The distances are normalized, unlike the determinants of the
 * {@link LineSegment.$coefficients}, which scale with the lengths of the
 * segments, so that two very short segments would always look parallel.
 */
function isCollinear(line: StartEvent, ev: StartEvent): boolean {
	const { $origin: o, $direction: d } = line.$segment as LineSegment;
	const length = Math.hypot(d.x, d.y);
	const distance = (p: IPoint): number =>
		Math.abs(d.x * (p.y - o.y) - d.y * (p.x - o.x)) / length;
	return distance(ev.$point) < RELAXED_EPSILON &&
		distance(ev.$other.$point) < RELAXED_EPSILON;
}

/**
 * The crossing point of the lines of two segments, or `undefined` if the lines
 * are parallel.
 *
 * The computation carries floating errors, so that the same geometric point
 * could be represented by slightly different values on different segments
 * (for example, a vertex of one polygon lying on an edge of another), making
 * the subsequent comparisons inconsistent. So we make it as exact as possible:
 *
 * - If one of the segments is axis-parallel, the point lies exactly on it, and
 *   the other coordinate is given by the line of the other segment alone. In
 *   particular, the coefficients of a very short segment, which make the
 *   general computation ill-conditioned, are not involved.
 * - If the point is close to an endpoint of the segments, it is that endpoint.
 */
function crossPoint(ev1: StartEvent, ev2: StartEvent): IPoint | undefined {
	const s1 = ev1.$segment as LineSegment, s2 = ev2.$segment as LineSegment;
	const pt = axisCross(s1, s2) ?? axisCross(s2, s1) ?? generalCross(s1, s2);
	if(!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return undefined;
	for(const e of [ev1, ev2]) {
		for(const p of [e.$point, e.$other.$point]) {
			if(epsilonSame(pt, p, RELAXED_EPSILON)) return p;
		}
	}
	for(const e of [ev1, ev2]) {
		const p = violatedEnd(e, pt);
		if(p) return p;
	}
	return pt;
}

/**
 * The endpoint of the segment of the event, if the given point on the segment
 * is not strictly between the endpoints in the ordering of the events.
 *
 * The ordering compares the x-coordinates with tolerance and then the
 * y-coordinates, so for a nearly vertical segment, a point near the start
 * could be ordered before the start (or similarly for the end). Such a point
 * is regarded as the endpoint, so that the segment is not subdivided there,
 * and the other segment is subdivided at the endpoint instead, keeping the two
 * consistent. The displacement is at most the tolerance times the slope.
 */
function violatedEnd(e: StartEvent, pt: IPoint): IPoint | undefined {
	const segment = e.$segment as LineSegment;
	if(!segment.$containsPtOnLine(pt, true)) return undefined;
	const start = e.$point, end = e.$other.$point;
	if(isAlmostZero(pt.x - start.x) && floatXyComparator(start, pt) >= 0) {
		return start;
	}
	if(isAlmostZero(pt.x - end.x) && floatXyComparator(pt, end) >= 0) {
		return end;
	}
	return undefined;
}

/** The crossing point given by the first segment if it is axis-parallel. */
function axisCross(s: LineSegment, other: LineSegment): IPoint | undefined {
	const { $origin: o, $direction: d } = other;
	if(s.$direction.y === 0) {
		const y = s.$origin.y;
		return { x: d.x === 0 ? o.x : o.x + (y - o.y) * d.x / d.y, y };
	}
	if(s.$direction.x === 0) {
		const x = s.$origin.x;
		return { x, y: d.y === 0 ? o.y : o.y + (x - o.x) * d.y / d.x };
	}
	return undefined;
}

/** The crossing point of two lines in parametric form. */
function generalCross(s1: LineSegment, s2: LineSegment): IPoint {
	const { $origin: o1, $direction: d1 } = s1;
	const { $origin: o2, $direction: d2 } = s2;
	const cross = d1.x * d2.y - d1.y * d2.x;
	const t = ((o2.x - o1.x) * d2.y - (o2.y - o1.y) * d2.x) / cross;
	return { x: o1.x + t * d1.x, y: o1.y + t * d1.y };
}

//=================================================================
/**
 * {@link GeneralIntersector} is the {@link Intersector} for general line
 * segments.
 */
//=================================================================

export class GeneralIntersector extends Intersector {

	public $possibleIntersection(
		ev1?: StartEvent | undefined, ev2?: StartEvent | undefined
	): void {
		if(!ev1 || !ev2) return;
		const seg1 = ev1.$segment as LineSegment;
		const seg2 = ev2.$segment as LineSegment;

		if(isCollinear(ev1, ev2) || isCollinear(ev2, ev1)) {
			// Sort the two by their starting points. The order in the status
			// is not enough, as collinear segments are ordered by their keys
			// there, so ev1 could start later than ev2, in which case the
			// starting point of ev1 would be missed below.
			const swap = floatXyComparator(ev1.$point, ev2.$point) > 0;
			if(swap) [ev1, ev2] = [ev2, ev1];
			const [s1, s2] = swap ? [seg2, seg1] : [seg1, seg2];
			const p2 = ev1.$other.$point;
			const p3 = ev2.$point, p4 = ev2.$other.$point;
			if(s1.$containsPtOnLine(p3, false)) {
				ev1 = this._subdivide(ev1, p3);
			}
			if(s1.$containsPtOnLine(p4, false)) this._subdivide(ev1, p4);
			if(s2.$containsPtOnLine(p2, false)) this._subdivide(ev2, p2);
		} else {
			// Crossing case
			const pt = crossPoint(ev1, ev2);
			if(pt) this._crossIntersection(ev1, ev2, pt);
		}
	}

	/** This method is overwritten in {@link OverlapIntersector}. */
	protected _crossIntersection(
		ev1: StartEvent, ev2: StartEvent, pt: IPoint
	): void {
		const seg1 = ev1.$segment as LineSegment;
		const seg2 = ev2.$segment as LineSegment;
		if(
			seg1.$containsPtOnLine(pt, false) &&
			seg2.$containsPtOnLine(pt, true)
		) this._subdivide(ev1, pt);
		if(
			seg2.$containsPtOnLine(pt, false) &&
			seg1.$containsPtOnLine(pt, true)
		) this._subdivide(ev2, pt);
	}

	protected override _subdivide(
		event: StartEvent, point: IPoint
	): StartEvent {
		if(
			epsilonSame(point, event.$point, RELAXED_EPSILON) ||
			epsilonSame(point, event.$other.$point, RELAXED_EPSILON)
		) {
			// Skip subdivision when the split point is too close to either
			// endpoint.
			// Creating near-degenerate segments leads to unreliable slope
			// values, causing the status BST comparator to become inconsistent
			// and failing to locate nodes during $getPrev/$getNext lookups.
			return event;
		}
		if(
			floatXyComparator(event.$point, point) >= 0 ||
			floatXyComparator(point, event.$other.$point) >= 0
		) {
			// The split point must also lie strictly between the endpoints in
			// the ordering of the events, which compares the coordinates with
			// tolerance. Otherwise, for a nearly vertical segment, the end of
			// a part could be processed before its start.
			return event;
		}
		return super._subdivide(event, point);
	}
}
