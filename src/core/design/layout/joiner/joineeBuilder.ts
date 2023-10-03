import { Vector } from "core/math/geometry/vector";
import { opposite } from "shared/types/direction";
import { Point } from "core/math/geometry/point";
import { Joinee } from "./joinee";

import type { QuadrantDirection } from "shared/types/direction";
import type { Joiner } from "./joiner";
import type { Piece } from "../pattern/piece";
import type { JAnchor } from "shared/json";

//=================================================================
/**
 * {@link JoineeBuilder} helps complete the complicated construction of {@link Joinee}s.
 */
//=================================================================

export class JoineeBuilder {

	private readonly _anchors: JAnchor[] = [];
	private _offset: IPoint = { x: 0, y: 0 };
	private _additionalOffset?: Vector;

	constructor(
		private readonly p: Piece,
		private readonly q: QuadrantDirection,
		private readonly _joiner: Joiner
	) {}

	/**
	 * This is the most complicated part of constructing a {@link Joinee}.
	 */
	public $setup(that: JoineeBuilder, f: Sign, shift: IPoint): number {
		const int = this._joiner.$getRelayJoinIntersection(that.p, shift, opposite(this.q));
		if(!int || !int.$isIntegral) return NaN;

		let offset: IPoint;
		if(this._joiner.$oriented) {
			this._offset = offset = int.$toIPoint();
			this.p.$offset(offset);
			this._anchors[this._joiner.q] = {
				location: { x: -offset.x, y: -offset.y },
			};
			return offset.x;
		} else {
			const target = f == 1 ? that : this;
			target._offset = offset = { x: f * (that.p.sx - int.x), y: f * (that.p.sy - int.y) };
			target.p.$offset(offset);
			this._anchors[this._joiner.q] = {
				location: { x: this.p.sx + f * offset.x, y: this.p.sy + f * offset.y },
			};
			return f * offset.x;
		}
	}

	public set $additionalOffset(offset: IPoint) {
		this._additionalOffset = new Vector(offset);
	}

	public get $anchor(): Point {
		let a = this.p.$anchors[this._joiner.q]!;
		if(this._additionalOffset) a = a.$add(this._additionalOffset);
		return a;
	}

	public get $jAnchor(): Point {
		return new Point(this._anchors[this._joiner.q].location!);
	}

	public $build(pt: Point): Joinee {
		return new Joinee(
			this.p, this._offset, this._anchors, pt, this.q, this._additionalOffset
		);
	}
}
