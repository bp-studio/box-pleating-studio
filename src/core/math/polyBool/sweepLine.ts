import { same } from "shared/types/geometry";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { RavlTree } from "shared/data/bst/ravlTree";

import type { EventProvider } from "./eventProvider";
import type { Intersector, IntersectorConstructor } from "./intersector";
import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";
import type { IHeap } from "shared/data/heap/heap";
import type { SweepEvent, EndEvent, StartEvent } from "./event";
import type { ISegment } from "./segment/segment";

//=================================================================
/**
 * {@link SweepLine} is the base class for all types of sweep line algorithms.
 *
 * The core idea of the sweep line algorithm is to imagine that a
 * sweep line (vertical, but infinitesimally tilted to the left,
 * so that it doesn't overlap with any given lines as it moves)
 * moving from the left to the right of the plane.
 *
 * As it moves, the {@link _status} of the sweep line is defined as the ordered
 * list of lines intersected with it (from the bottom to the top).
 * For any two given lines to have an intersection, they must be
 * adjacent in the list at some point during the sweeping process,
 * so it suffices to check the adjacent lines in the status queue
 * to find all intersections of the given lines. It is this property
 * that makes the sweep line algorithm really fast.
 */
//=================================================================

export abstract class SweepLine {

	/**
	 * The logic for event construction and comparison (for ordering them).
	 */
	protected readonly _provider: EventProvider;

	/**
	 * Event queue is an {@link IHeap} that stores all the future {@link SweepEvent}s
	 * that have not yet occurred at the current stage of sweeping.
	 * The events will be popped one by one from the queue and processed.
	 */
	protected readonly _eventQueue: IHeap<SweepEvent>;

	/** The current intersection state of sweeping. */
	protected readonly _status: IBinarySearchTree<StartEvent>;

	/** Logic for finding intersections among the given {@link ISegment}s. */
	protected readonly _intersector: Intersector;

	/** The {@link ISegment}s we collected during the course. */
	protected readonly _collectedSegments: ISegment[] = [];

	constructor(provider: EventProvider, Intersector: IntersectorConstructor) {
		this._provider = provider;
		this._eventQueue = new BinaryHeap(provider.$eventComparator);
		this._status = new RavlTree(provider.$statusComparator);
		this._intersector = new Intersector(provider, this._eventQueue);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Abstract methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Process an {@link EndEvent}. */
	protected abstract _processEnd(event: EndEvent): void;

	/** Whether an initial {@link ISegment} is oriented. */
	protected abstract _isOriented(segment: ISegment, delta: Sign): boolean;

	/**
	 * Determine whether an {@link ISegment} is considered "inside" in some sense.
	 * For example, in the use case of taking polygon union,
	 * we only want those segments that are on the outside (i.e. not inside),
	 * while in taking polygon intersection we need th opposite.
	 * (See {@link StartEvent.$isInside}).
	 */
	protected abstract _setInsideFlag(event: StartEvent, prev?: StartEvent): void;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Reset the state of self (for reusing instance). */
	protected _reset(): void {
		this._provider.$reset();
		this._collectedSegments.length = 0;
	}

	/** The main routine of the sweep line algorithm. */
	protected _collect(): void {
		while(!this._eventQueue.$isEmpty) {
			const event = this._eventQueue.$pop()!;
			if(!event.$isStart) this._processEnd(event);
			else this._processStart(event);
		}
	}

	/** Process a {@link StartEvent}. */
	protected _processStart(event: StartEvent): void {
		this._status.$insert(event, event);
		const prev = this._status.$getPrev(event);
		const next = this._status.$getNext(event);

		// It is possible that after finding an intersection and subdividing the segments,
		// a newly created event is inserted in front of the current event in the event queue.
		// In that case, we need to handle those inserted events first.
		const inserted = this._intersector.$process(prev, event, next);

		if(!inserted) {
			// Process inside flag only when there's no event being inserted.
			this._setInsideFlag(event, prev);
		} else {
			// Otherwise we put the event back into the queue,
			// and process it again later. Note that in edge cases,
			// we will still have to repeat the same process above without cheating,
			// since it is possible that it also have intersections with the
			// new prev/next events.
			this._eventQueue.$insert(event);
		}
	}

	/**
	 * Add an {@link ISegment} during initialization.
	 * @param segment The segment itself.
	 * @param isEntering Whether this segment is entering its corresponding polygon.
	 */
	protected _addSegment(segment: ISegment, delta: Sign): void {
		if(same(segment.$start, segment.$end)) return; // Skip degenerated segments
		const [startPoint, endPoint] = this._isOriented(segment, delta) ?
			[segment.$start, segment.$end] : [segment.$end, segment.$start];

		// Create sweep events
		const startEvent = this._provider.$createStart(startPoint, segment, delta);
		const endEvent = this._provider.$createEnd(endPoint, segment);
		endEvent.$other = startEvent;
		startEvent.$other = endEvent;

		// Add events
		this._eventQueue.$insert(startEvent);
		this._eventQueue.$insert(endEvent);
	}
}
