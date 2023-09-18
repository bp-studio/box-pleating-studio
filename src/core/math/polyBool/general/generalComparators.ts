import { EPSILON } from "../segment/arcSegment";
import { fix } from "../intersection/rrEventProvider";

import type { Comparator } from "shared/types/types";
import type { StartEvent, SweepEvent } from "../event";

function eventComparator(comparator: Comparator<StartEvent>): Comparator<SweepEvent> {
	return (a, b) =>
		fix(a.$point.x - b.$point.x) ||
		fix(a.$point.y - b.$point.y) ||
		// End events are prioritized for the events at the same location.
		a.$isStart - b.$isStart ||
		a.$isStart && (segmentComparator(a, b as StartEvent) || comparator(a, b as StartEvent)) ||
		a.$key - b.$key;
}

function statusComparator(comparator: Comparator<StartEvent>): Comparator<StartEvent> {
	return (a, b) =>
		compareUpDown(a, b) ||
		segmentComparator(a, b) ||
		comparator(a, b) ||
		a.$key - b.$key;
}

/** Compare two {@link StartEvent}s with the same start point. */
const segmentComparator: Comparator<StartEvent> = (a, b) =>
	// The one with the smaller tangent slope goes first (be aware of floating error)
	fix(getEventSlope(a) - getEventSlope(b)) ||
	// Borders go before creases
	a.$segment.$type - b.$segment.$type;

const exitFirstComparator: Comparator<StartEvent> = (a, b) => a.$wrapDelta - b.$wrapDelta;

const enterFirstComparator: Comparator<StartEvent> = (a, b) => b.$wrapDelta - a.$wrapDelta;

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

export const EventComparator = {
	exit: eventComparator(exitFirstComparator),
	enter: eventComparator(enterFirstComparator),
};

export const StatusComparator = {
	exit: statusComparator(exitFirstComparator),
	enter: statusComparator(enterFirstComparator),
};
