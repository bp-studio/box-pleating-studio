import { GeneralIntersector } from "./generalIntersector";
import { LineSegment } from "../../classes/segment/lineSegment";
import { GeneralEventProvider } from "./generalEventProvider";
import { UnionBase } from "../unionBase";
import { epsilonSame, floatXyComparator } from "core/math/geometry/float";
import { Initializer } from "../initializer";
import { Chainer } from "../../classes/chainer/chainer";

import type { EndEvent } from "../../classes/event";
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

	constructor() {
		super(new GeneralEventProvider(false), new GeneralIntersector(), new Chainer(), generalInitializer);

		// General union will require epsilon comparison in the chainer
		this._chainer.$checkFunction = epsilonSame;
	}

	/**
	 * It turns out that in our use cases,
	 * it is possible to have `>>` formation even for perfectly valid input,
	 * so we need to override this method.
	 */
	protected override _processEnd(event: EndEvent): void {
		const start = event.$other;
		const prev = this._status.$getPrev(start);
		const next = this._status.$getNext(start);
		if(!start.$isInside) this._collectedSegments.push(start.$segment);
		this._status.$delete(start);

		// Need to check intersections after an EndEvent
		this._intersector.$possibleIntersection(prev, next);
	}
}

export const generalInitializer = new Initializer(LineSegment, floatXyComparator);
