import { LineSegment } from "../segment/lineSegment";
import { CreaseType } from "shared/types/cp";
import { xyComparator } from "shared/types/geometry";
import { Clip } from "../clip/clip";
import { OverlapIntersector } from "./overlapIntersector";

import type { StartEvent } from "../event";
import type { Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link Overlap} is the sweep line algorithm used for testing whether
 * two given polygons overlap. It shares much of the logic with {@link Clip},
 * so we simply make a derived class out of it.
 */
//=================================================================

export class Overlap extends Clip {

	/**
	 * Note that the {@link Overlap} instance can be in a dirty state after
	 * completion, so a new instance must be create on every call
	 * to the {@link _test} method. We use this static method
	 * to control this behavior.
	 */
	public static $test(...polygon: Polygon): boolean {
		const instance = new Overlap();
		return instance._test(polygon);
	}

	private constructor() {
		super(OverlapIntersector);
	}

	/** Test if two oriented paths overlap. */
	private _test(polygon: Polygon): boolean {
		for(const path of polygon) {
			const l = path.length;
			for(let i = 0, j = l - 1; i < l; j = i++) {
				const p1 = path[j];
				const p2 = path[i];
				const segment = new LineSegment(p1, p2, CreaseType.Auxiliary);
				// Here it is assumed that the inputs are oriented in clockwise direction.
				const delta = xyComparator(p1, p2) < 0 ? -1 : 1;
				this._addSegment(segment, delta);
			}
		}

		while(!this._eventQueue.$isEmpty) {
			const event = this._eventQueue.$pop()!;
			if(event.$isStart) this._processStart(event);
			else this._processEnd(event);

			// Once we found a proof of intersection, we can stop.
			if(
				this._collectedSegments.length > 1 ||
				(this._intersector as OverlapIntersector).$found
			) return true;
		}
		return false;
	}

	protected override _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		if(prev && prev.$wrapCount != 0) {
			event.$wrapCount += prev.$wrapCount;
			event.$isInside = event.$wrapCount != 0;
		}
	}
}
