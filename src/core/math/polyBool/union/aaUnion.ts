import { Chainer } from "../chainer/chainer";
import { AALineSegment } from "../segment/aaLineSegment";
import { AAIntersector } from "./aaIntersector";
import { AAEventProvider } from "./aaEventProvider";
import { UnionBase } from "./unionBase";

import type { Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link AAUnion} computes the union of certain {@link Polygon}s,
 * with the premise that all edges are axis-aligned and all subpaths have been oriented.
 *
 * For performance reasons, it does not check for these conditions,
 * so unexpected results may occur if the input does not meet these conditions.
 */
//=================================================================

export class AAUnion extends UnionBase {

	constructor(checkSelfIntersection: boolean = false, chainer: Chainer | undefined = undefined) {
		super(new AAEventProvider(), AAIntersector, chainer || new Chainer(), AALineSegment);
		(this._intersector as AAIntersector).$checkSelfIntersection = checkSelfIntersection;
	}
}
