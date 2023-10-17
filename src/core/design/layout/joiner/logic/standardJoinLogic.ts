import { Line } from "core/math/geometry/line";
import { triangleTransform } from "core/math/geometry/rationalPath";
import { Fraction } from "core/math/fraction";
import { BaseJoinLogic } from "./baseJoinLogic";

import type { JoinResult } from "./joinLogic";
import type { Point } from "core/math/geometry/point";

//=================================================================
/**
 * Standard joins are two special cases of more generalized joins.
 * It applies a transformation to the base join,
 * essentially adding a level-shifter to make the pattern integral.
 */
//=================================================================
export class StandardJoinLogic extends BaseJoinLogic {

	public override *$join(): Generator<JoinResult> {
		if(!this.data) return;
		const { D1, D2, B1, B2, delta } = this._baseJoinIntersections();
		const { f } = this;

		if(B1 && D2 && !B1.eq(D2)) {
			if(D2.x * f > B1.x * f) yield* this._obtuseStandardJoin(B1, D2, 0);
			else yield* this._acuteStandardJoin(B1, D2, 1, delta);
		}
		if(B2 && D1 && !B2.eq(D1)) {
			if(D1.x * f > B2.x * f) yield* this._obtuseStandardJoin(B2, D1, 1);
			else yield* this._acuteStandardJoin(B2, D1, 0, delta);
		}
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Obtuse standard join.
	 */
	private *_obtuseStandardJoin(B: Point, D: Point, i: number): Generator<JoinResult> {
		if(B.$isIntegral) return; // Degenerated to base join
		const { pt } = this.data;
		const { j1, j2, f } = this;
		let e = [j1.e, j2.e][i];
		const p = [j1.p, j2.p][i];

		// If the two gadgets are pointing inwards instead of outwards,
		// there's no obtuse join (at least there's no such transformation so far).
		// TODO: Think about this more deeply.
		if(this.joiner.$isClockwise != j1.$isSteeperThan(j2)) return;

		if(!this._setupAnchor(D)) return;
		const P = D.sub(B).$slope.gt(Fraction.ONE) ? e.$xIntersection(D.x) : e.$yIntersection(D.y);
		const T = closestGridPoint(this._substituteEnd(e, B), D);

		// Before version 0.6, if the closest grid point happens to be the tip of the gadget,
		// the tracing algorithm couldn't handle such cases, so we discarded those.
		// TODO: Check if it is still the case in the new tracing algorithm since v0.6.
		if(T.eq(e.p1) || T.eq(e.p2)) return;

		// If the triangle is too small, it could go out of bounds
		const R = triangleTransform([D, P, B], T);
		if(!R || R.x * f < pt.x * f) return;

		// Check if the transformed R-point goes out of bounds
		// by checking the intersection of line segments.
		e = this._substituteEnd([j1.e, j2.e][1 - i], D);
		const test = e.$intersection(new Line(T, R));
		if(test && !test.eq(T) && !test.eq(R)) return;

		this.data.addOns = [{
			contour: [D, T, R].map(point => point.$toIPoint()),
			dir: new Line(T, R).$reflect(p.$direction).$toIPoint(),
		}];
		this._setupDetour([i == 0 ? T : D, R], [i == 0 ? D : T, R]);
		yield this._result(true, R.$dist(T));
	}

	/**
	 * Acute standard join.
	 */
	private *_acuteStandardJoin(B: Point, D: Point, i: number, delta: Line): Generator<JoinResult> {
		if(D.$isIntegral) return; // Degenerated to base join
		const { j1, j2 } = this;
		const e = [j1.e, j2.e][i], p = [j1.p, j2.p][i];
		const T = closestGridPoint(this._substituteEnd(e, D), B);

		// Before version 0.6, if the closest grid point happens to be the tip of the gadget,
		// the tracing algorithm couldn't handle such cases, so we discarded those.
		// TODO: Check if it is still the case in the new tracing algorithm since v0.6.
		if(T.eq(e.p1) || T.eq(e.p2)) return;

		const P = D.sub(B).$slope.gt(Fraction.ONE) ?
			delta.$yIntersection(T.y) : delta.$xIntersection(T.x);
		const R = triangleTransform([T, D, P], B);
		if(!R || !this._setupAnchor(R)) return;
		this.data.addOns = [{
			contour: [B, T, R].map(point => point.$toIPoint()),
			dir: new Line(T, B).$reflect(p.$direction).$toIPoint(),
		}];
		this._setupDetour(i == 0 ? [T, B] : [B], i == 0 ? [B] : [T, B]);
		yield this._result(true, B.$dist(T));
	}

	/**
	 * Change one the endpoints of the critical edge to the B-intersection,
	 * in order to get the actual edge before transforming.
	 */
	private _substituteEnd(e: Line, p: Point): Line {
		const [p1, p2] = e.$xOrient();
		return new Line(p, this.joiner.$oriented ? p2 : p1);
	}
}

function closestGridPoint(e: Line, p: Point): Point {
	let r!: Point, d: number = Number.POSITIVE_INFINITY;
	for(const i of e.$gridPoints()) {
		const dist = i.$dist(p);
		if(dist < d) {
			d = dist;
			r = i;
		}
	}
	return r;
}
