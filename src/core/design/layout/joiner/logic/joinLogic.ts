import { Point } from "core/math/geometry/point";
import { JoineeBuilder } from "../joineeBuilder";
import { cache } from "core/utils/cache";
import { Gadget } from "../../pattern/gadget";
import { Fraction } from "core/math/fraction";

import type { Vector } from "core/math/geometry/vector";
import type { RationalPath } from "core/math/geometry/rationalPath";
import type { Joinee } from "../joinee";
import type { JAddOn, JDevice, JGadget } from "shared/json";
import type { Joiner } from "../joiner";
import type { Piece } from "../../pattern/piece";

/**
 * The first value is the {@link JDevice} itself,
 * while the second value is the weight of it.
 */
export type JoinResult = [JDevice, number];

interface JoinData {
	readonly size: number;

	/**
	 * As we move from p1-perspective to p2-perspective,
	 * the addition offset that needs to be added.
	 */
	readonly offset?: IPoint;

	/** The point of join. */
	readonly pt: Point;

	/** The vector of the angle bisector of axis-parallel creases. */
	readonly bv: Vector;

	readonly org: Point;

	addOns?: JAddOn[];
}

/** Give ten-times the weight for `extraSize` over {@link JoinData.size}. */
const EXTRA_SIZE_WEIGHT = 10;

//=================================================================
/**
 * {@link JoinLogic} handles the core calculation for joining two given
 * {@link Piece}s into one {@link JDevice}.
 */
//=================================================================

export abstract class JoinLogic {

	protected readonly joiner: Joiner;

	/**
	 * The critical parameters used for joining.
	 * Absence of this object implies that the joining is infeasible.
	 */
	protected data!: JoinData;

	readonly j1!: Joinee;
	readonly j2!: Joinee;
	readonly f!: Sign;

	constructor(joiner: Joiner, p1: Piece, p2: Piece) {
		const { $oriented, s1, s2, q1, q2, w1, w2 } = this.joiner = joiner;
		let size = p1.sx + p2.sx;

		const builder1 = new JoineeBuilder(p1, q1, joiner);
		const builder2 = new JoineeBuilder(p2, q2, joiner);

		// Calculate the starting point of relay join
		if(s1) size += builder1.$setup(builder2, 1, s1, w1);
		if(s2) size += builder2.$setup(builder1, -1, s2, w2);
		if(isNaN(size)) return;

		let offset: IPoint | undefined;
		if(!$oriented) builder2.$additionalOffset = offset = { x: p1.sx - p2.sx, y: p1.sy - p2.sy };

		// Gather important parameters
		const pt = s1 ? builder1.$anchor : builder2.$anchor;
		const bv = p1.$bisector(p2);
		this.f = $oriented ? 1 : -1;

		let org = Point.ZERO;
		if(!$oriented) org = s1 ? builder1.$jAnchor : builder1.$anchor;

		this.j1 = builder1.$build(pt);
		this.j2 = builder2.$build(pt);
		this.data = { offset, size, pt, bv, org };
	}

	public abstract $join(): Generator<JoinResult>;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	@cache protected get _deltaPt(): Point {
		const { org } = this.data;
		const { j1, j2, f } = this;
		const { $isClockwise: cw, $intersectionDist: $intDist } = this.joiner;
		return new Point(
			org.x + ($intDist - (cw ? j2.p : j1.p).ox) * f,
			org.y + ($intDist - (cw ? j1.p : j2.p).oy) * f
		);
	}

	/**
	 * Setup the {@link Piece.detours} for the two {@link Piece}s.
	 *
	 * The input arrays are listed starting with the vertex far most
	 * from the joining point, and not including the joining point itself.
	 */
	protected _setupDetour(dt1: RationalPath, dt2: RationalPath): void {
		const { j1, j2 } = this;
		const shouldReverse = this.joiner.$isClockwise;
		j1.$setupDetour(dt1, !shouldReverse);
		j2.$setupDetour(dt2, shouldReverse);
	}

	/**
	 * Setup the intersection anchor by the given point,
	 * and return whether it was successful.
	 */
	protected _setupAnchor(a: Point): boolean {
		const { j1, j2, f } = this;
		const { $oriented, $isClockwise: cw } = this.joiner;

		// If the intersection anchor goes beyond the delta point, it fails
		if(a.x * f > this._deltaPt.x * f) return false;

		j1.$setupAnchor($oriented != cw, a);
		j2.$setupAnchor($oriented == cw, a);
		return true;
	}

	/**
	 * Generated {@link JoinResult}.
	 * @param shouldClone Whether the piece should be cloned.
	 */
	protected _result(shouldClone: boolean = false, extraSize: number = 0): JoinResult {
		const { offset, size, addOns } = this.data;
		const { j1, j2 } = this;
		const oriented = this.joiner.$oriented;
		this.data.addOns = undefined;
		const g1 = j1.$toGadget(shouldClone, oriented);
		const g2 = j2.$toGadget(shouldClone, oriented, offset);

		// Uncomment the following for debugging non-simple contour issue
		// JoinLogic.debugContour(g1, g2);

		return [
			{ gadgets: [g1, g2], addOns },
			size + extraSize * EXTRA_SIZE_WEIGHT,
		];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/// #if DEBUG
	/* istanbul ignore next: debug */
	public static debugContour(g1: JGadget, g2: JGadget): void {
		// eslint-disable-next-line @typescript-eslint/no-magic-numbers
		const pt = new Point(new Fraction(429, 7 as Positive), new Fraction(520, 7 as Positive));
		const c1 = new Gadget(g1).$contour;
		const c2 = new Gadget(g2).$contour;
		if(c1.some(p => p.eq(pt)) || c2.some(p => p.eq(pt))) {
			// Paste the result of the following output to debug tools for inspection
			console.log(JSON.stringify([[c1.map(p => p.$toIPoint())], [c2.map(p => p.$toIPoint())]]));
			debugger;
		}
	}
	/// #endif
}
