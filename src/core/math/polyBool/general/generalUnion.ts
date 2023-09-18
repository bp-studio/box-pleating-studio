import { GeneralIntersector } from "./generalIntersector";
import { LineSegment } from "../segment/lineSegment";
import { GeneralEventProvider } from "./generalEventProvider";
import { ExChainer } from "../chainer/exChainer";
import { UnionBase } from "../union/unionBase";

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
		super(new GeneralEventProvider(false), GeneralIntersector, new ExChainer(), LineSegment);
	}
}
