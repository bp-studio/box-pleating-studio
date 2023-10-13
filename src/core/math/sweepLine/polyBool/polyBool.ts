import { pathToString, pointToString } from "../../geometry/path";
import { DivideAndCollect } from "../divideAndCollect";
import { same } from "shared/types/geometry";

import type { Path, Polygon } from "shared/types/geometry";
import type { Intersector } from "../classes/intersector";
import type { ISegment } from "../classes/segment/segment";
import type { EventProvider } from "../classes/eventProvider";
import type { Chainer } from "../classes/chainer/chainer";
import type { StartEvent } from "../classes/event";

//=================================================================
/**
 * {@link PolyBool} is the base class of boolean operations on {@link Polygon}s.
 */
//=================================================================

export abstract class PolyBool<ComponentType, PathType extends Path = Path> extends DivideAndCollect {

	/** Logic for final assembling. */
	protected readonly _chainer: Chainer<PathType>;

	constructor(
		provider: EventProvider,
		intersector: Intersector,
		chainer: Chainer<PathType>
	) {
		super(provider, intersector);
		this._chainer = chainer;
	}

	/** Generates the polygons of interest. */
	public $get(...components: ComponentType[]): PathType[] {
		this._reset();
		this._initialize(components);
		this._sweep();
		return this._chainer.$chain(this._collectedSegments);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Load all initial events. */
	protected abstract _initialize(components: ComponentType[]): void;

	protected override _isOriented(segment: ISegment, delta: Sign): boolean {
		return delta === 1; // For PolyBool, it can be simply determined by the delta
	}

	protected override _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		// If the previous segment just exited, then the current segment should be on the boundary.
		if(prev && prev.$wrapCount != 0) {
			event.$wrapCount += prev.$wrapCount;
			event.$isInside = event.$wrapCount != 0;
		}

		// Uncomment the following for wrapping debug.
		// event.$prev = prev;
		// if(same(event.$point, { x: 63, y: 114 })) debugWrap(event);
	}
}

///#if DEBUG
export function createTestCase(components: Polygon[]): void {
	console.log(components.map(c => "[" + c.map(p => `parsePath("${pathToString(p)}")`).join(",") + "]").join(",\n"));
}

export function debugWrap(event: StartEvent): void {
	if(same(event.$point, { x: 63, y: 114 })) {
		let cursor: StartEvent | undefined = event;
		while(cursor) {
			console.log(
				pointToString(cursor.$point),
				pointToString(cursor.$other.$point),
				cursor.$isInside,
				cursor.$wrapCount
			);
			cursor = cursor.$prev;
		}
	}
}
///#endif
