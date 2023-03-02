import { SweepLine } from "./sweepLine";

import type { ISegment } from "./segment/segment";
import type { EventProvider } from "./eventProvider";
import type { Polygon } from "shared/types/geometry";
import type { IntersectorConstructor } from "./intersector";
import type { Chainer } from "./chainer/chainer";
import type { StartEvent } from "./event";

//=================================================================
/**
 * {@link PolyBool} is the base class of boolean operations on polygons.
 */
//=================================================================

export abstract class PolyBool<ComponentType> extends SweepLine {

	/** Logic for final assembling. */
	protected readonly _chainer: Chainer;

	constructor(
		provider: EventProvider,
		Intersector: IntersectorConstructor,
		chainer: Chainer
	) {
		super(provider, Intersector);
		this._chainer = chainer;
	}

	/** Generates the polygons of interest. */
	public $get(...components: ComponentType[]): Polygon {
		this._reset();
		this._initialize(components);
		this._collect();
		return this._chainer.$chain(this._collectedSegments);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected abstract _initialize(components: ComponentType[]): void;

	protected _isOriented(segment: ISegment, delta: Sign): boolean {
		return delta === 1; // For PolyBool, it can be simply determined by the delta
	}

	protected _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		// If the previous segment just exited, then the current segment should be on the boundary.
		if(prev && prev.$wrapCount != 0) {
			event.$wrapCount += prev.$wrapCount;
			event.$isInside = event.$wrapCount != 0;
		}

		// console.log(
		// 	event.$isInside,
		// 	event.$key & 0xfff,
		// 	event.$wrapDelta,
		// 	event.$wrapCount,
		// 	event.$point, event.$other.$point,
		// 	event.$segment.$type === 2 ? (event.$segment as ArcSegment).$radius : 0,
		// 	event.$segment.$type === 2 ? getSlope(event) : NaN,
		// 	prev?.$point, prev?.$other.$point,
		// 	prev?.$segment.$type === 2 ? getSlope(prev) : NaN,
		// 	prev?.$wrapCount);
	}
}
