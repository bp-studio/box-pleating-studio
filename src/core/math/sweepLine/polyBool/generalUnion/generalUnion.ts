import { GeneralIntersector } from "./generalIntersector";
import { LineSegment } from "../../classes/segment/lineSegment";
import { GeneralEventProvider } from "./generalEventProvider";
import { UnionBase } from "../unionBase";
import { epsilonSame, floatXyComparator } from "core/math/geometry/float";
import { Initializer } from "../initializer";
import { Chainer } from "../../classes/chainer/chainer";
import { generalEndProcessor } from "../../classes/endProcessor";

import type { Polygon } from "shared/types/geometry";
import type { AAUnion } from "../aaUnion/aaUnion";

//=================================================================
/**
 * {@link GeneralUnion} computes the union for general {@link Polygon}s.
 *
 * As it compares general line segments, it is about 2x slower than the
 * specialized {@link AAUnion}, and is used only when needed.
 */
//=================================================================

export class GeneralUnion extends UnionBase {

	protected override readonly _chainer = new Chainer();
	protected override readonly _initializer = generalInitializer;

	/**
	 * It turns out that in our use cases,
	 * it is possible to have `>>` formation even for perfectly valid input,
	 * so we need to override this method.
	 */
	protected override readonly _endProcessor = generalEndProcessor;
	protected override readonly _shouldPickInside = false;

	constructor() {
		super(new GeneralEventProvider(false), new GeneralIntersector());

		// General union will require epsilon comparison in the chainer
		this._chainer.$checkFunction = epsilonSame;
	}
}

export const generalInitializer = new Initializer(LineSegment, floatXyComparator);
