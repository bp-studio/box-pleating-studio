import { xyComparator } from "shared/types/geometry";
import { Chainer } from "../chainer/chainer";
import { AALineSegment } from "../segment/aaLineSegment";
import { AAIntersector } from "./aaIntersector";
import { AAEventProvider } from "./aaEventProvider";
import { PolyBool } from "../polyBool";

import type { EndEvent } from "../event";
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

export class AAUnion extends PolyBool {

	constructor(checkSelfIntersection: boolean = false, chainer: Chainer | undefined = undefined) {
		super(new AAEventProvider(), AAIntersector, chainer || new Chainer());
		(this._intersector as AAIntersector).$checkSelfIntersection = checkSelfIntersection;
	}

	/** Generates the polygon of the union. */
	public override $get(...components: Polygon[]): Polygon {
		this._initialize(components);
		return super.$get();
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Process an {@link EndEvent}. */
	protected _processEnd(event: EndEvent): void {
		const start = event.$other;
		if(!start.$isInside) this._collectedSegments.push(start.$segment);
		this._status.$delete(start);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Load all initial events. */
	private _initialize(components: Polygon[]): void {
		this._provider.$reset();
		this._collectedSegments.length = 0;
		for(let i = 0; i < components.length; i++) {
			const c = components[i];
			for(const path of c) {
				for(let j = 0; j < path.length; j++) {
					const p1 = path[j], p2 = path[(j + 1) % path.length];
					const segment = new AALineSegment(p1, p2, i);
					const entering = xyComparator(p1, p2) < 0;
					if(entering) this._addSegment(segment, 1);
					else this._addSegment(segment, -1);
				}
			}
		}
	}
}
