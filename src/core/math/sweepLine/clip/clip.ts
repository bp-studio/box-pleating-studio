import { GeneralIntersector } from "../polyBool/generalUnion/generalIntersector";
import { LineSegment } from "../classes/segment/lineSegment";
import { CreaseType } from "shared/types/cp";
import { xyComparator } from "shared/types/geometry";
import { GeneralEventProvider } from "../polyBool/generalUnion/generalEventProvider";
import { epsilonSame } from "core/math/geometry/float";
import { DivideAndCollect } from "../divideAndCollect";

import type { Intersector } from "../classes/intersector";
import type { ISegment } from "../classes/segment/segment";
import type { CPLine } from "shared/types/cp";
import type { StartEvent, EndEvent } from "../classes/event";
import type { Chainer } from "../classes/chainer/chainer";
import type { PolyBool } from "../polyBool/polyBool";

//=================================================================
/**
 * {@link Clip} is the sweep line algorithm used for generating CP.
 *
 * It does three things:
 * 1. Clip all line segments inside the given sheet boundary.
 * 2. Subdivide all lines at intersections.
 * 3. Remove duplicates.
 *
 * Since it only cares about the lines, it doesn't use a {@link Chainer}
 * like the {@link PolyBool}.
 */
//=================================================================

export class Clip extends DivideAndCollect {

	constructor(intersector: Intersector = new GeneralIntersector()) {
		super(new GeneralEventProvider(true), intersector);
	}

	/** Process the set of crease pattern lines. */
	public $get(creases: CPLine[]): CPLine[] {
		this._reset();

		for(const c of creases) {
			const p1 = { x: c[1], y: c[2] };
			const p2 = { x: c[3], y: c[4] };
			const segment = new LineSegment(p1, p2, 0, c[0]);
			if(c[0] == CreaseType.Border) {
				// Here it is assumed that the inputs are oriented
				const entering = xyComparator(p1, p2) < 0;
				if(entering) this._addSegment(segment, 1);
				else this._addSegment(segment, -1);
			} else {
				// All other creases have delta = 0
				this._addSegment(segment, 0);
			}
		}

		this._sweep();

		return this._collectedSegments.map(s =>
			[s.$type as CreaseType, s.$start.x, s.$start.y, s.$end.x, s.$end.y]
		);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _isOriented(segment: ISegment, delta: Sign): boolean {
		// Unlike PolyBool, we need to actually compare the endpoints here
		return xyComparator(segment.$start, segment.$end) < 0;
	}

	protected override _processEnd(event: EndEvent): void {
		const start = event.$other;
		const prev = this._status.$getPrev(start);
		const next = this._status.$getNext(start);
		if(start.$isInside) this._collectedSegments.push(start.$segment);
		this._status.$delete(start);

		// Unlike PolyBool, we need to check intersections after an EndEvent
		this._intersector.$possibleIntersection(prev, next);
	}

	protected override _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		if(prev) event.$wrapCount += prev.$wrapCount;
		event.$isInside = event.$segment.$type == CreaseType.Border || // borders always count
			!sameLine(event, prev) && // ignore identical lines
			event.$wrapCount != 0;
	}
}

function sameLine(ev1: StartEvent, ev2?: StartEvent): boolean {
	if(!ev2) return false;
	return epsilonSame(ev1.$point, ev2.$point) && epsilonSame(ev1.$other.$point, ev2.$other.$point);
}
