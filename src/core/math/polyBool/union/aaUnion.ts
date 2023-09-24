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
 *
 * It is guaranteed to generate paths that have no self-intersecting edges,
 * but note that it could generate paths revisiting the same point twice.
 * This, however, is not an issue for further operations.
 */
//=================================================================

export class AAUnion extends UnionBase {

	constructor(checkSelfIntersection: boolean = false) {
		super(new AAEventProvider(), AAIntersector, AALineSegment);
		(this._intersector as AAIntersector).$checkSelfIntersection = checkSelfIntersection;
	}
}
