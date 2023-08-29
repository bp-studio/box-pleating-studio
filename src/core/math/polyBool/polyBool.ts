import { SweepLine } from "./sweepLine";
import { pathToString } from "../geometry/path";

import type { ISegment } from "./segment/segment";
import type { EventProvider } from "./eventProvider";
import type { Path, Polygon } from "shared/types/geometry";
import type { IntersectorConstructor } from "./intersector";
import type { Chainer } from "./chainer/chainer";
import type { StartEvent } from "./event";

//=================================================================
/**
 * {@link PolyBool} is the base class of boolean operations on polygons.
 */
//=================================================================

export abstract class PolyBool<ComponentType, PathType extends Path = Path> extends SweepLine {

	/** Logic for final assembling. */
	protected readonly _chainer: Chainer<PathType>;

	constructor(
		provider: EventProvider,
		Intersector: IntersectorConstructor,
		chainer: Chainer<PathType>
	) {
		super(provider, Intersector);
		this._chainer = chainer;
	}

	/** Generates the polygons of interest. */
	public $get(...components: ComponentType[]): PathType[] {
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	///#if DEBUG
	public createTestCase(components: ComponentType[]): void {
		console.log("[" + components.map(c => "[" + (c as Polygon).map(p => `parsePath("${pathToString(p)}")`).join(",") + "]").join(","));
	}
	///#endif
}
