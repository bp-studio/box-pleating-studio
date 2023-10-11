import { SweepLine } from "./sweepLine";

import type { StartEvent } from "./classes/event";
import type { EventProvider } from "./classes/eventProvider";
import type { Intersector } from "./classes/intersector";
import type { ISegment } from "./classes/segment/segment";

//=================================================================
/**
 * {@link DivideAndCollect} is the main type of {@link SweepLine} algorithm
 * we will be using. It is for all types of tasks involving
 * "divide segments at their intersections, and collect segments
 * satisfying certain conditions".
 */
//=================================================================

export abstract class DivideAndCollect extends SweepLine {

	/** Logic for finding intersections among the given {@link ISegment}s. */
	protected readonly _intersector: Intersector;

	/** The {@link ISegment}s we collected during the course. */
	protected readonly _collectedSegments: ISegment[] = [];

	constructor(provider: EventProvider, intersector: Intersector) {
		super(provider);

		intersector.$setup(provider, this._eventQueue);
		this._intersector = intersector;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Abstract methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

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

	protected override _reset(): void {
		super._reset();
		this._collectedSegments.length = 0;
	}

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
}
