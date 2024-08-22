import { LineSegment } from "../classes/segment/lineSegment";
import { xyComparator } from "shared/types/geometry";
import { OverlapIntersector } from "./overlapIntersector";
import { DivideAndCollect } from "../divideAndCollect";
import { GeneralEventProvider } from "../polyBool/generalUnion/generalEventProvider";
import { compareOrientation } from "../classes/orientation";
import { generalEndProcessor } from "../classes/endProcessor";

import type { StartEvent } from "../classes/event";
import type { Path, Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link Overlap} is the sweep line algorithm used for testing whether
 * two given polygons overlap.
 */
//=================================================================

export class Overlap extends DivideAndCollect {

	/**
	 * Test if several paths has any overlap.
	 *
	 * For performance considerations, we do not check for self-intersection
	 * for each path, ane one must ensure that the parameters are simple paths,
	 * otherwise the algorithm will always return true in such a case.
	 *
	 * Note that the {@link Overlap} instance can be in a dirty state after
	 * completion, so a new instance must be create on every call
	 * to the {@link _test} method. We use this static method
	 * to control this behavior.
	 */
	public static $test(
		...polygon: [Path, Path, ...Path[]] // enforcing at least two paths
	): boolean {
		const instance = new Overlap();
		return instance._test(polygon);
	}

	protected override readonly _orientation = compareOrientation;
	protected override readonly _endProcessor = generalEndProcessor;
	protected override readonly _shouldPickInside = true;

	private constructor() {
		super(new GeneralEventProvider(true), new OverlapIntersector());
	}

	/** Test if two or more oriented paths overlap. */
	private _test(polygon: Polygon): boolean {
		for(const [n, path] of polygon.entries()) {
			const l = path.length;
			for(let i = 0, j = l - 1; i < l; j = i++) {
				const p1 = path[j];
				const p2 = path[i];
				const segment = new LineSegment(p1, p2, n);
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
