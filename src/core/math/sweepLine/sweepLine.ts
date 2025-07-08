import { same } from "shared/types/geometry";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { RavlTree } from "shared/data/bst/ravlTree";

import type { EventQueue } from "./classes/intersector";
import type { IOrientation } from "./classes/orientation";
import type { EventProvider } from "./classes/eventProvider";
import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";
import type { IHeap } from "shared/data/heap/heap";
import type { SweepEvent, EndEvent, StartEvent } from "./classes/event";
import type { ISegment } from "./classes/segment/segment";

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
	protected readonly _eventQueue: EventQueue;

	/** The current intersection state of sweeping. */
	protected readonly _status: IBinarySearchTree<StartEvent>;

	constructor(provider: EventProvider) {
		this._provider = provider;
		this._eventQueue = new BinaryHeap(provider.$eventComparator);
		this._status = new RavlTree(provider.$statusComparator);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Abstract members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Process a {@link StartEvent}. */
	protected abstract _processStart(event: StartEvent): void;

	/** Process an {@link EndEvent}. */
	protected abstract _processEnd(event: EndEvent): void;

	/** The logic for determine the orientation of an initial {@link ISegment}. */
	protected abstract readonly _orientation: IOrientation;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Reset the state of self (for reusing instance). */
	protected _reset(): void {
		this._provider.$reset();
	}

	/** The main routine of the sweep line algorithm. */
	protected _sweep(): void {
		while(!this._eventQueue.$isEmpty) {
			const event = this._eventQueue.$pop()!;
			if(!event.$isStart) this._processEnd(event);
			else this._processStart(event);
		}
	}

	/**
	 * Add an {@link ISegment} during initialization.
	 * @param segment The segment itself.
	 * @param isEntering Whether this segment is entering its corresponding polygon.
	 */
	protected _addSegment(segment: ISegment, delta: Sign): void {
		if(same(segment.$start, segment.$end)) return; // Skip degenerated segments
		const [startPoint, endPoint] = this._orientation(segment, delta) ?
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
