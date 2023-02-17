import { same } from "shared/types/geometry";
import { BinaryHeap } from "shared/data/heap/binaryHeap";
import { RavlTree } from "shared/data/bst/ravlTree";

import type { IEventProvider, Intersector, IntersectorConstructor } from "./intersector";
import type { Chainer } from "./chainer/chainer";
import type { IBinarySearchTree } from "shared/data/bst/binarySearchTree";
import type { IHeap } from "shared/data/heap/heap";
import type { SweepEvent, EndEvent, StartEvent } from "./event";
import type { ISegment } from "./segment/segment";
import type { Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link PolyBool} is the base class of boolean operations on polygons.
 */
//=================================================================

export abstract class PolyBool {

	/** Logic for event construction and comparison. */
	protected readonly _provider: IEventProvider;

	/** Event queue. */
	protected readonly _eventQueue: IHeap<SweepEvent>;

	/** The current state of sweeping. */
	protected readonly _status: IBinarySearchTree<StartEvent>;

	/** Logic for finding intersections. */
	protected readonly _intersector: Intersector;

	/** Logic for final assembling. */
	protected readonly _chainer: Chainer;

	/** The segments we collected during the course. */
	protected readonly _collectedSegments: ISegment[] = [];

	constructor(
		provider: IEventProvider,
		Intersector: IntersectorConstructor,
		chainer: Chainer
	) {
		this._provider = provider;
		this._eventQueue = new BinaryHeap(provider.$eventComparator);
		this._status = new RavlTree(provider.$statusComparator);
		this._intersector = new Intersector(provider, this._eventQueue);
		this._chainer = chainer;
	}

	/** 產生聯集的多邊形 */
	public $get(): Polygon {
		while(!this._eventQueue.$isEmpty) {
			const event = this._eventQueue.$pop()!;
			if(!event.$isStart) this._processEnd(event);
			else this._processStart(event);
		}
		return this._chainer.$chain(this._collectedSegments);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Process an {@link EndEvent} */
	protected abstract _processEnd(event: EndEvent): void;

	/**
	 * Add a segment during initialization.
	 * @param segment The segment itself.
	 * @param isEntering Whether this segment is entering its corresponding polygon.
	 */
	protected _addSegment(segment: ISegment, delta: -1 | 1): void {
		if(same(segment.$start, segment.$end)) return; // Skip degenerated segments
		const [startPoint, endPoint] = delta === 1 ?
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Process a {@link StartEvent}. */
	private _processStart(event: StartEvent): void {
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

	private _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		// If the previous segment just exited, then the current segment should be on the boundary.
		if(prev && prev.$wrapCount != 0) {
			event.$wrapCount += prev.$wrapCount;
			event.$isInside = event.$wrapCount != 0;
		}

		// console.log(
		// 	event.$isInside,
		// 	event.$wrapCount,
		// 	event.$point, event.$other.$point,
		// 	event.$segment.$type === 2 ? (event.$segment as ArcSegment).$radius : 0,
		// 	event.$segment.$type === 2 ? getSlope(event) : NaN,
		// 	prev?.$point, prev?.$other.$point,
		// 	prev?.$segment.$type === 2 ? getSlope(prev) : NaN,
		// 	prev?.$wrapCount);
	}
}
