import type { EventProvider } from "./eventProvider";
import type { AALineSegment } from "./segment/aaLineSegment";
import type { IHeap } from "shared/data/heap/heap";
import type { StartEvent, SweepEvent } from "./event";

export type EventQueue = IHeap<SweepEvent>;

export interface IntersectorConstructor {
	new(provider: EventProvider, queue: EventQueue): Intersector;
}

//=================================================================
/**
 * {@link Intersector} is the base class for segment intersection logic.
 */
//=================================================================

export abstract class Intersector {

	/** The {@link StartEvent} that is being processed */
	protected _currentStart!: StartEvent;

	/** Whether there is a new event being inserted to the front of the event queue. */
	protected _eventInserted: boolean = false;

	private readonly _provider: EventProvider;
	private readonly _queue: EventQueue;

	constructor(provider: EventProvider, queue: EventQueue) {
		this._provider = provider;
		this._queue = queue;
	}

	/** Process possible intersections, and returns if there is an insertion. */
	public $process(prev: StartEvent | undefined, ev: StartEvent, next: StartEvent | undefined): boolean {
		this._currentStart = ev;
		this._eventInserted = false;
		this.$possibleIntersection(prev, ev);
		this.$possibleIntersection(ev, next);
		return this._eventInserted;
	}

	/**
	 * This is the main method that the derived classes need to implement,
	 * which considers various situations to find possible intersection points of the segments,
	 * and calls the {@link _subdivide} method properly to subdivide the segments.
	 * The derived classes can make highly optimized performance tuning for specific requirements in this method.
	 */
	public abstract $possibleIntersection(ev1?: StartEvent, ev2?: StartEvent): void;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Subdivide a segment at the given point, and returns the {@link StartEvent} of the second segment. */
	protected _subdivide(event: StartEvent, point: IPoint): StartEvent {
		const provider = this._provider;
		const segment = event.$segment;
		const newSegment = segment.$subdivide(point, event.$point === segment.$start);

		const end = event.$other;
		const newStart = provider.$createStart(point, newSegment, event.$wrapDelta);
		newStart.$other = end;
		end.$other = newStart;
		this._queue.$insert(newStart);

		const newEnd = provider.$createEnd(point, segment);
		newEnd.$other = event;
		event.$other = newEnd;
		this._queue.$insert(newEnd);

		// If the edge being subdivided is not the edge being processed...
		if(event != this._currentStart && !this._eventInserted) {
			// ...check if there is a new event being inserted to the front of the event queue
			this._eventInserted ||=
				provider.$eventComparator(this._currentStart, newStart) > 0 ||
				provider.$eventComparator(this._currentStart, newEnd) > 0;
		}

		return newStart;
	}

	/** Processing AA segments. This is used in derived classes. */
	protected _processAALineSegments(ev1: StartEvent, ev2: StartEvent): void {
		const seg1 = ev1.$segment as AALineSegment;
		const seg2 = ev2.$segment as AALineSegment;
		if(seg1.$isHorizontal != seg2.$isHorizontal) {
			// Cross intersecting
			const h = seg1.$isHorizontal ? ev1 : ev2;
			const v = seg1.$isHorizontal ? ev2 : ev1;
			const x = v.$point.x, y = h.$point.y;
			const hx1 = h.$point.x, hx2 = h.$other.$point.x;
			const vy1 = v.$point.y, vy2 = v.$other.$point.y;
			if(hx1 < x && x < hx2 && vy1 <= y && y <= vy2) this._subdivide(h, { x, y });
			if(vy1 < y && y < vy2 && hx1 <= x && x <= hx2) this._subdivide(v, { x, y });
		} else {
			this._processOverlap(ev1, ev2, seg1.$isHorizontal);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Process the case where the two line segment overlaps. */
	private _processOverlap(ev1: StartEvent, ev2: StartEvent, isHorizontal: boolean): void {
		// We know that ev1 and ev2 are sorted
		const { x: x1, y: y1 } = ev1.$point;
		const p2 = ev1.$other.$point, { x: x2, y: y2 } = p2;
		const p3 = ev2.$point, { x: x3, y: y3 } = p3;
		const p4 = ev2.$other.$point, { x: x4, y: y4 } = p4;

		if(isHorizontal && y1 === y3) {
			// horizontal overlapping
			if(x1 < x3 && x3 < x2) ev1 = this._subdivide(ev1, p3);
			if(x1 < x4 && x4 < x2) this._subdivide(ev1, p4);
			else if(x3 < x2 && x2 < x4) this._subdivide(ev2, p2);
		} else if(!isHorizontal && x1 === x3) {
			// vertical overlapping
			if(y1 < y3 && y3 < y2) ev1 = this._subdivide(ev1, p3);
			if(y1 < y4 && y4 < y2) this._subdivide(ev1, p4);
			else if(y3 < y2 && y2 < y4) this._subdivide(ev2, p2);
		}
	}
}
