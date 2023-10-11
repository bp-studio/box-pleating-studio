import { AALineSegment } from "../../classes/segment/aaLineSegment";
import { AAIntersector } from "./aaIntersector";
import { AAEventProvider } from "./aaEventProvider";
import { UnionBase } from "../unionBase";
import { xyComparator } from "shared/types/geometry";
import { Initializer } from "../initializer";
import { Chainer } from "../../classes/chainer/chainer";

import type { Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link AAUnion} computes the union of certain {@link Polygon}s,
 * with the premise that all edges are axis-aligned and all subpaths have been oriented
 * (that is, counter-clockwise for outer boundary and clockwise for holes).
 *
 * For performance reasons, it does not check for these conditions,
 * so unexpected results may occur if the input does not meet these conditions.
 */
//=================================================================

export class AAUnion extends UnionBase {

	constructor(checkSelfIntersection: boolean = false, chainer: Chainer = new Chainer()) {
		super(new AAEventProvider(), new AAIntersector(checkSelfIntersection), chainer, AAInitializer);
	}
}

const AAInitializer = new Initializer(AALineSegment, xyComparator);
