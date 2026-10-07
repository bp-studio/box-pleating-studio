import { Line } from "core/math/geometry/line";
import { triangleTransform } from "core/math/geometry/rationalPath";
import { Fraction } from "core/math/fraction";
import { BaseJoinLogic } from "./baseJoinLogic";

import type { JoinResult } from "./joinLogic";
import type { Point } from "core/math/geometry/point";

type Index = 0 | 1;

//=================================================================
/**
 * Standard joins are two special cases of more generalized joins.
 * It applies a transformation to the base join,
 * essentially adding a level-shifter to make the pattern integral.
 */
//=================================================================
export class StandardJoinLogic extends BaseJoinLogic {

	public override *$join(): Generator<JoinResult> {
		// If the two gadgets can be simply joined, there's no need for
		// standard joins. With two junctions, simple joins come with a higher
		// priority so this won't happen, but in fans, the simple join on one
		// side might not work for the fan as a whole.
		if(!this.data || this._isSimple()) return;
		const { D1, D2, B1, B2, delta } = this._baseJoinIntersections();
		const { f } = this;

		if(B1 && D2 && !B1.eq(D2)) {
			if(D2.x * f > B1.x * f) yield* this._convexStandardJoin(B1, D2, 0);
			else yield* this._concaveStandardJoin(B1, D2, 1, delta);
		}
		if(B2 && D1 && !B2.eq(D1)) {
			if(D1.x * f > B2.x * f) yield* this._convexStandardJoin(B2, D1, 1);
			else yield* this._concaveStandardJoin(B2, D1, 0, delta);
		}
	}

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	/**
	 * Convex standard join.
	 */
	private *_convexStandardJoin(
		B: Point, D: Point, i: Index
	): Generator<JoinResult> {
		if(B.$isIntegral) return; // Degenerated to base join
		const { j1, j2 } = this;
		const e = i ? j2.e : j1.e;
		const p = i ? j2.p : j1.p;

		if(this._isPointingInwards()) return;

		if(!this._setupAnchor(D)) return;

		const tryResult = this._tryConvexTransform(e, B, D, i);
		if(!tryResult) return;
		const [T, R] = tryResult;

		this.data.addOns = [{
			contour: [D, T, R].map(point => point.$toIPoint()),
			dir: new Line(T, R).$reflect(p.$direction.value).$toIPoint(),
		}];
		this._setupDetour([i ? D : T, R], [i ? T : D, R]);
		yield this._result(true, R.$dist(T));
	}

	private _tryConvexTransform(
		e: Line, B: Point, D: Point, i: Index
	): [Point, Point] | null {
		const { pt } = this.data;
		const { j1, j2, f } = this;

		const P = D.$sub(B).$slope.gt(Fraction.ONE) ?
			e.$xIntersection(D._x) : e.$yIntersection(D._y);
		const gridPoints = closestGridPoints(this._substituteEnd(e, B), D);

		// The triangle does not degenerate. D differs from P, for otherwise
		// D lies on e, which means that the two critical edges meet on the
		// delta line, and that is the case of simple joins (see $join). Thus
		// D differs from any T on e as well.

		// It is possible that the closest T results in an R that goes out of
		// bounds. In that case we need to try the second closest T.
		for(const T of gridPoints) {
			// If the triangle is too small, it could go out of bounds.
			const R = triangleTransform([D, P, B], T);
			if(R.x * f < pt.x * f) continue;

			// Check if the transformed R-point goes out of bounds
			if(!(i ? j1 : j2).$contains(R)) continue;

			return [T, R];
		}
		return null;
	}

	/**
	 * Concave standard join.
	 */
	private *_concaveStandardJoin(
		B: Point, D: Point, i: Index, delta: Line
	): Generator<JoinResult> {
		if(D.$isIntegral) return; // Degenerated to base join
		const { j1, j2 } = this;
		const e = i ? j2.e : j1.e;
		const p = i ? j2.p : j1.p;
		const T = closestGridPoints(this._substituteEnd(e, D), B)[0];
		// The edge could contain no grid points at all, for example when the
		// gadget is half-integral.
		if(!T) return;

		const P = D.$sub(B).$slope.gt(Fraction.ONE) ?
			delta.$yIntersection(T._y) : delta.$xIntersection(T._x);
		// T differs from D as D is not integral. If T coincides with B, then B
		// lies on e, which means that the two critical edges meet on the bv
		// line. For non-parallel gadgets, that is the same as meeting on the
		// delta line (see $join), but not necessarily for parallel ones,
		// although no such layouts have been found so far.
		/* istanbul ignore next: foolproof */
		if(T.eq(B)) return;
		const R = triangleTransform([T, D, P], B);
		if(!this._setupAnchor(R)) return;
		this.data.addOns = [{
			contour: [B, T, R].map(point => point.$toIPoint()),
			dir: new Line(T, B).$reflect(p.$direction.value).$toIPoint(),
		}];
		this._setupDetour(i ? [B] : [T, B], i ? [T, B] : [B]);
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

/**
 * Return the grid points on {@link e}, in the order of distance to {@link p}.
 *
 * In practice there won't be many such grid points,
 * so sorting them shouldn't be significant in terms of performance.
 */
function closestGridPoints(e: Line, p: Point): Point[] {
	const gridPoints = e.$gridPoints().map(
		q => [q, q.$dist(p)] as [Point, number]
	);
	gridPoints.sort((a, b) => a[1] - b[1]);
	return gridPoints.map(t => t[0]);
}
