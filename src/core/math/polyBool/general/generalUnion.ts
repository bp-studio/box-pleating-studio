import { GeneralIntersector } from "./generalIntersector";
import { LineSegment } from "../segment/lineSegment";
import { GeneralEventProvider } from "./generalEventProvider";
import { UnionBase } from "../union/unionBase";
import { EPSILON } from "../segment/arcSegment";

import type { Polygon } from "shared/types/geometry";
import type { AAUnion } from "../union/aaUnion";

//=================================================================
/**
 * {@link GeneralUnion} computes the union for general {@link Polygon}s.
 *
 * As it compares general line segments, it is about 2x slower than the
 * specialized {@link AAUnion}, and is used only when needed.
 */
//=================================================================

export class GeneralUnion extends UnionBase {

	constructor() {
		super(new GeneralEventProvider(false), GeneralIntersector, LineSegment);

		// General union will require epsilon comparison in the chainer
		this._chainer.$checkFunction = epsilonSame;
	}
}

function epsilonSame(p1: IPoint, p2: IPoint): boolean {
	return Math.abs(p1.x - p2.x) < EPSILON && Math.abs(p1.y - p2.y) < EPSILON;
}
