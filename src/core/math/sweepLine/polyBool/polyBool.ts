import { pathToString, pointToString } from "../../geometry/path";
import { DivideAndCollect } from "../divideAndCollect";
import { deltaOrientation } from "../classes/orientation";

import type { Path, Polygon } from "shared/types/geometry";
import type { Chainer } from "../classes/chainer/chainer";
import type { StartEvent } from "../classes/event";

//=================================================================
/**
 * {@link PolyBool} is the base class of boolean operations on {@link Polygon}s.
 */
//=================================================================

export abstract class PolyBool<ComponentType, PathType extends Path = Path> extends DivideAndCollect {

	/** Logic for final assembling. */
	protected abstract readonly _chainer: Chainer<PathType>;

	protected override readonly _orientation = deltaOrientation;

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

	protected override _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		// If the previous segment just exited, then the current segment should be on the boundary.
		if(prev && prev.$wrapCount != 0) {
			event.$wrapCount += prev.$wrapCount;
			event.$isInside = event.$wrapCount != 0;
		}

		// Uncomment the following for wrapping debug.
		// event.$prev = prev;
		// if(event.$point.x == 73 && event.$point.y == 118) debugWrap(event);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	///#if DEBUG

	/* istanbul ignore next: debug */
	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	protected createTestCase(components: Polygon[]): void {
		console.log(components.map(c => "[" + c.map(p => `parsePath("${pathToString(p)}")`).join(",") + "]").join(",\n"));
	}

	/* istanbul ignore next: debug */
	// eslint-disable-next-line @typescript-eslint/class-methods-use-this
	protected debugWrap(event: StartEvent): void {
		let cursor: StartEvent | undefined = event;
		while(cursor) {
			console.log(
				cursor.$segment.$polygon,
				pointToString(cursor.$point),
				pointToString(cursor.$other.$point),
				cursor.$isInside,
				cursor.$wrapCount
			);
			cursor = cursor.$prev;
		}
	}
	///#endif
}
