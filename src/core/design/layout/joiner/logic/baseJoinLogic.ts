import { Line } from "core/math/geometry/line";
import { JoinLogic } from "./joinLogic";
import { QV } from "../../pattern/quadrant";

import type { JoinResult } from "./joinLogic";
import type { Point } from "core/math/geometry/point";

type NPoint = Point | null;

interface BaseJoinContext {
	D1: NPoint;
	D2: NPoint;
	B1: NPoint;
	B2: NPoint;
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
		const try1 = this.tryJoin(B1, D2, true, true);
		if(try1) yield try1;
		const try2 = this.tryJoin(B2, D1, false, false);
		if(try2) yield try2;
	}

	/**
	 * Find the four critical intersections of the base join.
	 *
	 * It's worth mentioning that those four intersections doesn't always present.
	 * If the angles of the two {@link Gadget} are very "steep",
	 * chances are that only one pair will show up.
	 */
	protected _baseJoinIntersections(): BaseJoinContext {
		const { bv, pt } = this.data;
		const { j1, j2 } = this;
		const deltaPt = this._deltaPt;
		const delta = new Line(deltaPt, QV[0]);
		const D1 = j1.e.$intersection(deltaPt, QV[0]);
		const D2 = j2.e.$intersection(deltaPt, QV[0]);
		const B1 = j1.e.$intersection(pt, bv);
		const B2 = j2.e.$intersection(pt, bv);
		return { D1, D2, B1, B2, delta };
	}

	private tryJoin(B: NPoint, D: NPoint, Din2: boolean, shouldClone: boolean): JoinResult | undefined {
		const { j1, j2, f } = this;
		if(!B || !D) return;
		if(B.$isIntegral && D.$isIntegral && !B.eq(D)) {
			// There is no obtuse join if the two gadgets are "pointing inwards",
			// as the straight-skeleton degenerates into a relay pattern.
			if(D.x * f > B.x * f && this.joiner.$isClockwise != j1.$isSteeperThan(j2)) return;

			/* istanbul ignore next: debug */
			if(!this._setupAnchor(D)) return;

			if(Din2) this._setupDetour([B], [D, B]);
			else this._setupDetour([D, B], [B]);
			return this._result(shouldClone);
		}
	}
}
