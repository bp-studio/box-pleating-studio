import { GeneralIntersector } from "../polyBool/generalUnion/generalIntersector";
import { LineSegment } from "../classes/segment/lineSegment";
import { CreaseType } from "shared/types/cp";
import { xyComparator } from "shared/types/geometry";
import { GeneralEventProvider } from "../polyBool/generalUnion/generalEventProvider";
import { epsilonSame } from "core/math/geometry/float";
import { DivideAndCollect } from "../divideAndCollect";
import { compareOrientation } from "../classes/orientation";
import { generalEndProcessor } from "../classes/endProcessor";

import type { CPLine } from "shared/types/cp";
import type { StartEvent } from "../classes/event";
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

	protected override readonly _orientation = compareOrientation;
	protected override readonly _endProcessor = generalEndProcessor;
	protected override readonly _shouldPickInside = true;

	constructor() {
		super(new GeneralEventProvider(true), new GeneralIntersector());
	}

	/** Process the set of crease pattern lines. */
	public $get(creases: CPLine[]): CPLine[] {
		this._reset();

		for(const c of creases) {
			const { p1, p2 } = c;
			const segment = new LineSegment(p1, p2, 0, c.type);
			if(c.type == CreaseType.Border) {
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

		return this._collectedSegments.map(s => ({
			type: s.$type as CreaseType,
			p1: s.$start,
			p2: s.$end,
		}));
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

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
