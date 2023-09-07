import { Point } from "core/math/geometry/point";
import { Vector } from "core/math/geometry/vector";
import { JoinCandidateBuilder } from "../joinCandidateBuilder";
import { cache } from "core/utils/cache";

import type { JoinCandidate } from "../joinCandidate";
import type { JAddOn, JDevice } from "shared/json";
import type { Joiner } from "../joiner";
import type { Piece } from "../../pattern/piece";

/**
 * The first value is the {@link JDevice} itself,
 * while the second value is the weight of it.
 */
export type JoinResult = [JDevice, number];

interface JoinData {
	readonly size: number;
	readonly c1: JoinCandidate;
	readonly c2: JoinCandidate;

	/**
	 * As we move from p1-perspective to p2-perspective,
	 * the addition offset that needs to be added.
	 */
	readonly offset?: IPoint;

	readonly pt: Point;

	/** The vector of the angle bisector of axis-parallel creases. */
	readonly bv: Vector;

	readonly org: Point;
	readonly f: number;
	addOns?: JAddOn[];
}

/** Give ten-times the weight for `extraSize` over {@link JoinData.size}. */
const EXTRA_SIZE_WEIGHT = 10;

//=================================================================
/**
 * {@link JoinLogic} handles the core calculation for joining two given
 * {@link Gadget}s into one {@link Device}.
 */
//=================================================================

export abstract class JoinLogic {

	protected readonly joiner: Joiner;
	protected data!: JoinData;

	constructor(joiner: Joiner, p1: Piece, p2: Piece) {
		const { $oriented, s1, s2, q1, q2 } = this.joiner = joiner;
		let size = p1.sx + p2.sx;

		const b1 = new JoinCandidateBuilder(p1, q1, joiner);
		const b2 = new JoinCandidateBuilder(p2, q2, joiner);

		// Calculate the starting point of relay join
		if(s1) size += b1.$setup(b2, 1, s1);
		if(s2) size += b2.$setup(b1, -1, s2);
		if(isNaN(size)) return;

		let offset: IPoint | undefined;
		if(!$oriented) b2.$additionalOffset = offset = { x: p1.sx - p2.sx, y: p1.sy - p2.sy };

		// Gather important parameters
		const pt = s1 ? b1.$anchor : b2.$anchor;
		const bv = Vector.$bisector(p1.$direction, p2.$direction);
		const f = $oriented ? 1 : -1;

		let org = Point.ZERO;
		if(!$oriented) org = s1 ? b1.$jAnchor : b1.$anchor;

		this.data = { c1: b1.$build(pt), c2: b2.$build(pt), offset, size, pt, bv, org, f };
	}

	public abstract $join(): Generator<JoinResult>;

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Protected members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	@cache protected get _deltaPt(): Point {
		const { org, c1, c2, f } = this.data;
		const { cw, $intDist } = this.joiner;
		return new Point(
			org.x + ($intDist - (cw ? c2.p : c1.p).ox) * f,
			org.y + ($intDist - (cw ? c1.p : c2.p).oy) * f
		);
	}

	/**
	 * Setup the {@link Piece.detours} for the two {@link Piece}s.
	 *
	 * The input arrays are listed starting with the vertex far most
	 * from the joining point, and not including the joining point itself.
	 */
	protected _setupDetour(dt1: Point[], dt2: Point[]): void {
		const { c1, c2 } = this.data;
		const shouldReverse2 = this.joiner.cw;
		c1.$setupDetour(dt1, !shouldReverse2);
		c2.$setupDetour(dt2, shouldReverse2);
	}

	/**
	 * Setup the intersection anchor by the given point,
	 * and return whether it was successful.
	 */
	protected _setupAnchor(a: Point): boolean {
		const { c1, c2, f } = this.data;
		const { $oriented, cw } = this.joiner;

		// If the intersection anchor goes beyond the delta point, it fails
		if(a.x * f > this._deltaPt.x * f) return false;

		c1.$setupAnchor($oriented != cw, a);
		c2.$setupAnchor($oriented == cw, a);
		return true;
	}

	/** Generated {@link JoinResult}. */
	protected _result(json?: boolean, extraSize?: number): JoinResult {
		const { c1, c2, offset, size, addOns } = this.data;
		this.data.addOns = undefined;
		return [
			{
				gadgets: [c1.$toGadget(json), c2.$toGadget(json, offset)],
				addOns,
			},
			size + (extraSize ?? 0) * EXTRA_SIZE_WEIGHT,
		];
	}
}
