import { ListUnionFind } from "shared/data/unionFind/listUnionFind";
import { AAUnion } from "./aaUnion";
import { UnionChainer } from "../../classes/chainer/unionChainer";

import type { StartEvent } from "../../classes/event";
import type { PathEx, Polygon } from "shared/types/geometry";
import type { RoughContour } from "core/design/context";

/** Each {@link UnionResult} is a connected component. */
export interface UnionResult {
	/**
	 * All paths of this component.
	 * There should be exactly one outer boundary and zero or more inner holes.
	 */
	paths: PathEx[];

	/** The indices of source {@link Polygon}s that contribute to this component. */
	from: readonly number[];
}

//=================================================================
/**
 * {@link RoughUnion} is specialized for processing {@link RoughContour}s.
 *
 * Besides taking union, it also group the result into components
 * and match the components to the source {@link Polygon}s.
 */
//=================================================================

export class RoughUnion extends AAUnion {

	private _unionFind!: ListUnionFind<number>;

	constructor() {
		/**
		 * In our use case, the inputs are the expanded rough contours
		 * of child components, and in general it is possible for
		 * non-self-intersecting contours to become self-intersecting after expansion
		 * (both for the outer boundary and for the inner holes),
		 * so we should always check for self-intersections.
		 */
		super(true, new UnionChainer());
	}

	public $union(...components: Polygon[]): UnionResult[] {
		const result = this.$get(...components);
		return this._unionFind.$list().map(from => {
			const paths = result.filter(p => from.includes(p.from!));
			return { paths, from };
		});
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	protected override _initialize(components: Polygon[]): void {
		this._unionFind = new ListUnionFind(components.length);
		super._initialize(components);
	}

	protected override _setInsideFlag(event: StartEvent, prev?: StartEvent): void {
		super._setInsideFlag(event, prev);
		const source = event.$segment.$polygon;
		if(!event.$isInside && event.$wrapDelta === 1) {
			this._unionFind.$add(source);
		} else {
			const prevSource = prev!.$segment.$polygon;
			if(source !== prevSource) this._unionFind.$union(source, prevSource);
		}
	}
}
