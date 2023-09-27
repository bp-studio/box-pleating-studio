import { PolyBool } from "../polyBool";
import { xyComparator } from "shared/types/geometry";
import { UnionChainer } from "../chainer/unionChainer";

import type { ISegment } from "../segment/segment";
import type { EndEvent } from "../event";
import type { EventProvider } from "../eventProvider";
import type { IntersectorConstructor } from "../intersector";
import type { PathEx, Polygon } from "shared/types/geometry";

type LineConstructor = new (p1: IPoint, p2: IPoint, i: number) => ISegment;

//=================================================================
/**
 * {@link UnionBase} is the base type of union operations.
 */
//=================================================================

export abstract class UnionBase extends PolyBool<Polygon, PathEx> {

	private readonly _lineConstructor: LineConstructor;

	constructor(
		provider: EventProvider,
		Intersector: IntersectorConstructor,
		lineConstructor: LineConstructor
	) {
		super(provider, Intersector, new UnionChainer());
		this._lineConstructor = lineConstructor;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _initialize(components: Polygon[]): void {
		for(let i = 0; i < components.length; i++) {
			const c = components[i];
			for(const path of c) {
				for(let j = 0; j < path.length; j++) {
					const p1 = path[j], p2 = path[(j + 1) % path.length];
					const segment = new this._lineConstructor(p1, p2, i);
					const entering = xyComparator(p1, p2) < 0;
					if(entering) this._addSegment(segment, 1);
					else this._addSegment(segment, -1);
				}
			}
		}
	}

	protected _processEnd(event: EndEvent): void {
		const start = event.$other;
		if(!start.$isInside) this._collectedSegments.push(start.$segment);
		this._status.$delete(start);
	}
}
