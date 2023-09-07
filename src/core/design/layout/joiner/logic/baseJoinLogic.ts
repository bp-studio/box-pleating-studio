import { Line } from "core/math/geometry/line";
import { JoinLogic } from "./joinLogic";
import { QV } from "../../pattern/quadrant";

import type { JoinResult } from "./joinLogic";
import type { Point } from "core/math/geometry/point";

interface BaseJoinContext {
	D1: Point;
	D2: Point;
	B1: Point;
	B2: Point;
	delta: Line;
}

//=================================================================
/**
 * The two types of base joins are the foundations of a family of
 * more generalized joins.
 *
 * In theory, base joins always work if the grid is allowed to be
 * subdivided. But of course that is not the case in practice,
 * so base join can only be used directly if the critical
 * intersections are on the grid.
 */
//=================================================================
export class BaseJoinLogic extends JoinLogic {

	public *$join(): Generator<JoinResult> {
		if(!this.data) return;
		const { D1, D2, B1, B2 } = this._baseJoinIntersections();

		if(B1?.$isIntegral && D2?.$isIntegral && !B1.eq(D2)) {
			if(!this._setupAnchor(D2)) return;
			this._setupDetour([B1], [D2, B1]);
			yield this._result(true);
		}
		if(B2?.$isIntegral && D1?.$isIntegral && !B2.eq(D1)) {
			if(!this._setupAnchor(D1)) return;
			this._setupDetour([D1, B2], [B2]);
			yield this._result();
		}
	}

	/**
	 * Find the four critical intersections of the base join.
	 *
	 * It's worth mentioning that those four intersections doesn't always present.
	 * If the angles of the two {@link Gadget} are very "steep",
	 * chances are that only one pair will show up.
	 */
	protected _baseJoinIntersections(): BaseJoinContext {
		const { bv, c1, c2, pt } = this.data;
		const delta = new Line(this._deltaPt, QV[0]), beta = new Line(pt, bv);
		const D1 = c1.e.$intersection(delta)!, D2 = c2.e.$intersection(delta)!;
		const B1 = c1.e.$intersection(beta)!, B2 = c2.e.$intersection(beta)!;
		return { D1, D2, B1, B2, delta };
	}
}
