import { EventProvider } from "../eventProvider";
import { EndEvent, StartEvent } from "../event";
import { fix } from "../intersection/rrEventProvider";
import { EPSILON } from "../segment/arcSegment";

import type { SweepEvent } from "../event";
import type { ISegment } from "../segment/segment";
import type { Comparator } from "shared/types/types";
import type { Clip } from "./clip";

//=================================================================
/**
 * {@link ClipEventProvider} is the {@link IEventProvider} used in {@link Clip}.
 * It finds intersections of general line segments.
 *
 * Since the subjects are general lines,
 * epsilon-comparison is also needed here.
 * Fortunately, as the algorithm is very fast already,
 * overall it takes no time to handle any CP, no matter how complicated.
 */
//=================================================================

export class ClipEventProvider extends EventProvider {

	$createStart(startPoint: IPoint, segment: ISegment, delta: Sign): StartEvent {
		return new StartEvent(startPoint, segment, delta, this._nextId++);
	}

	$createEnd(endPoint: IPoint, segment: ISegment): EndEvent {
		return new EndEvent(endPoint, this._nextId++);
	}

	$eventComparator: Comparator<SweepEvent> = eventComparator;
	$statusComparator: Comparator<StartEvent> = statusComparator;
}

const eventComparator: Comparator<SweepEvent> = (a, b) =>
	fix(a.$point.x - b.$point.x) ||
	fix(a.$point.y - b.$point.y) ||
	// End events are prioritized for the events at the same location.
	a.$isStart - b.$isStart ||
	a.$isStart && segmentComparator(a, b as StartEvent) ||
	a.$key - b.$key;

const statusComparator: Comparator<StartEvent> = (a, b) =>
	compareUpDown(a, b) ||
	segmentComparator(a, b) ||
	a.$key - b.$key;

/** Compare two {@link StartEvent}s with the same start point. */
const segmentComparator: Comparator<StartEvent> = (a, b) =>
	// The one with the smaller tangent slope goes first (be aware of floating error)
	fix(getEventSlope(a) - getEventSlope(b)) ||
	// Borders go before creases
	a.$segment.$type - b.$segment.$type;

function compareUpDown(a: StartEvent, b: StartEvent): number {
	const ax = a.$point.x, bx = b.$point.x;
	if(Math.abs(ax - bx) < EPSILON) return fix(a.$point.y - b.$point.y);
	if(ax < bx) return fix(getEventSlope(a) - getSlope(a.$point, b.$point));
	return fix(getSlope(a.$point, b.$point) - getEventSlope(b));
}

function getEventSlope(e: StartEvent): number {
	return getSlope(e.$point, e.$other.$point);
}

function getSlope(p1: IPoint, p2: IPoint): number {
	const dx = p1.x - p2.x;
	if(Math.abs(dx) < EPSILON) return Number.POSITIVE_INFINITY;
	return (p1.y - p2.y) / dx;
}
