import { EndEvent, StartEvent } from "../event";
import { xyComparator } from "shared/types/geometry";
import { SegmentType } from "../segment/segment";
import { yIntercept } from "./rrIntersector";
import { EPSILON } from "../segment/arcSegment";
import { EventProvider } from "../eventProvider";

import type { ArcSegment } from "../segment/arcSegment";
import type { Segment } from "./rrIntersector";
import type { ISegment } from "../segment/segment";
import type { Comparator } from "shared/types/types";
import type { SweepEvent } from "../event";

//=================================================================
/**
 * {@link RREventProvider} generates and compares events between AA lines and arcs.
 * The comparison logic here is far more complex than that between merely AA lines,
 * so it cannot be quickly compared through encoding and must be fully written out.
 * Fortunately, the vast majority of comparisons will yield results quickly,
 * and only a few will require computation until the end.
 */
//=================================================================

export class RREventProvider extends EventProvider {

	public $createStart(startPoint: IPoint, segment: ISegment, delta: Sign): StartEvent {
		return new StartEvent(startPoint, segment, delta, this._nextId++);
	}

	public $createEnd(endPoint: IPoint, segment: ISegment): EndEvent {
		return new EndEvent(endPoint, this._nextId++);
	}

	public readonly $eventComparator: Comparator<SweepEvent> = eventComparator;
	public readonly $statusComparator: Comparator<StartEvent> = statusComparator;
}

const eventComparator: Comparator<SweepEvent> = (a, b) =>
	xyComparator(a.$point, b.$point) ||
	// End events are prioritized for the events at the same location.
	a.$isStart - b.$isStart ||
	a.$isStart && segmentComparator(a, b as StartEvent) ||
	a.$key - b.$key;

const statusComparator: Comparator<StartEvent> = (a, b) =>
	statusYComparator(a, b) ||
	// If a newly started line segment happens to intersect an existing segment in its interior,
	// the last computed result will be 0, and in theory the following results will not be of the desired order,
	// but it doesn't matter because the existing segment will be split,
	// and the new segments produced by the split will be compared again and inserted in the correct order.
	// We just need to make sure that when such an intersection occurs for the first time,
	// the existing segments are split correctly.
	segmentComparator(a, b) ||
	a.$key - b.$key;

/** Compare two {@link StartEvent}s with the same start point. */
const segmentComparator: Comparator<StartEvent> = (a, b) =>
	// The one with the smaller tangent slope goes first (be aware of floating error)
	fix(getSlope(a) - getSlope(b)) ||
	// Compare the curvature if the tangent slope equals
	getCurvature(a) - getCurvature(b) ||
	// In case of overlapping, the exiting segment goes first (opposite to case of union)
	a.$wrapDelta - b.$wrapDelta;

/** Compare the y-coordinate of the {@link StartEvent} */
const statusYComparator: Comparator<StartEvent> = (a, b) => {
	// In the case of arcs, it is not sufficient to simply compare the y-coordinate of the start event;
	// we need to select the correct start and end coordinates to make the comparison.
	if(a.$point.x < b.$point.x && a.$segment.$type === SegmentType.Arc) {
		return yIntercept(a.$segment as ArcSegment, b.$point.x) - b.$point.y;
	} else if(b.$point.x < a.$point.x && b.$segment.$type === SegmentType.Arc) {
		return a.$point.y - yIntercept(b.$segment as ArcSegment, a.$point.x);
	} else {
		return a.$point.y - b.$point.y;
	}
};

/** Calculate slope */
export function getSlope(e: StartEvent): number {
	const seg = e.$segment as Segment;
	if(seg.$type === SegmentType.AALine) {
		return seg.$isHorizontal ? 0 : Number.POSITIVE_INFINITY;
	} else {
		const dx = seg.$anchor.x - e.$point.x;
		const dy = seg.$anchor.y - e.$point.y;
		if(dx > EPSILON) return dy / dx;
		return dy > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	}
}

/** Calculate curvature */
export function getCurvature(e: StartEvent): number {
	const seg = e.$segment as Segment;
	if(seg.$type === SegmentType.AALine) return 0;
	const sgn = e.$point === seg.$start ? 1 : -1; // curve upwards or downwards
	return sgn / seg.$radius;
}

export function fix(x: number): number {
	if(Math.abs(x) < EPSILON) return 0;
	return x;
}
