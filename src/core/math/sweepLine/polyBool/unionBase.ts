import { PolyBool } from "./polyBool";
import { isClockwise } from "core/math/geometry/path";
import { simpleEndProcessor } from "../classes/endProcessor";

import type { Initializer } from "./initializer";
import type { PathEx, Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link UnionBase} is the base type of union operations.
 */
//=================================================================

export abstract class UnionBase extends PolyBool<Polygon, PathEx> {

	protected abstract readonly _initializer: Initializer;

	protected override readonly _endProcessor = simpleEndProcessor;
	protected override readonly _shouldPickInside = false;

	public override $get(...components: Polygon[]): PathEx[] {
		const result = super.$get(...components);
		result.forEach(path => path.isHole = isClockwise(path));
		return result;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected _initialize(components: Polygon[]): void {
		this._initializer.$init(components, (segment, delta) => this._addSegment(segment, delta));
	}
}
