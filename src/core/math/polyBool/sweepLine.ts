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
 */
//=================================================================

export abstract class SweepLine {

	/** Logic for event construction and comparison. */
	protected readonly _provider: EventProvider;

	/** Event queue. */
	protected readonly _eventQueue: IHeap<SweepEvent>;

	/** The current state of sweeping. */
	protected readonly _status: IBinarySearchTree<StartEvent>;

	/** Logic for finding intersections. */
	protected readonly _intersector: Intersector;

	/** The segments we collected during the course. */
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

	/** Whether an initial segment is oriented. */
	protected abstract _isOriented(segment: ISegment, delta: Sign): boolean;

	/** Determine whether a segment is considered "inside" in some sense. */
	protected abstract _setInsideFlag(event: StartEvent, prev?: StartEvent): void;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** The main routine of the sweep line algorithm. */
	protected _collect(): void {
		this._provider.$reset();
		this._collectedSegments.length = 0;
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
	 * Add a segment during initialization.
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
