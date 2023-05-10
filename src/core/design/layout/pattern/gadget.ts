import { Piece } from "./piece";
import { Point } from "core/math/geometry/point";
import { makePerQuadrant } from "shared/types/direction";
import { Vector } from "core/math/geometry/vector";
import { cache } from "core/utils/cache";

import type { PerQuadrant, QuadrantDirection } from "shared/types/direction";
import type { JAnchor, JGadget, JOverlap } from "shared/json";
import type { Device } from "./device";

/**
 * The first field is the anchor point itself,
 * ths second field is the index of the {@link Piece} from which it came (if available).
 */
export type AnchorMap = [Point, number | null];

//=================================================================
/**
 * {@link Gadget} is a component in a {@link Device} corresponding to a single {@link JOverlap}.
 * It always have four {@link JAnchor}s.
 */
//=================================================================
export class Gadget implements JGadget {

	public pieces: readonly Piece[];
	public offset?: IPoint;
	public anchors?: JAnchor[];

	constructor(data: JGadget) {
		this.pieces = data.pieces.map(p => new Piece(p));
		this.offset = data.offset;
		this.pieces.forEach(p => p.$offset(this.offset));
		this.anchors = data.anchors;
	}

	@cache public get $anchorMap(): PerQuadrant<AnchorMap> {
		return makePerQuadrant<AnchorMap>(q => {
			if(this.anchors?.[q]?.location) {
				const p = new Point(this.anchors[q].location!);
				if(this.offset) p.addBy(new Vector(this.offset));
				return [p, null];
			} else {
				if(this.pieces.length == 1) return [this.pieces[0].$anchors[q]!, 0];
				for(const [i, p] of this.pieces.entries()) {
					if(p.$anchors[q]) return [p.$anchors[q]!, i];
				}

				// Shouldn't enter here in theory
				debugger;
				throw new Error();
			}
		});
	}

	@cache public get $slack(): PerQuadrant<number> {
		return makePerQuadrant(q => this._getSlack(q));
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private _getSlack(q: QuadrantDirection): number {
		return this.anchors?.[q]?.slack ?? 0;
	}
}
