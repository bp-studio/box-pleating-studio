import { Point } from "core/math/geometry/point";
import { Vector } from "core/math/geometry/vector";
import { JoineeBuilder } from "../joineeBuilder";
import { cache } from "core/utils/cache";

import type { Joinee } from "../joinee";
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
 * {@link Gadget}s into one {@link Device}.
 */
//=================================================================

export abstract class JoinLogic {

	protected readonly joiner: Joiner;
	protected data!: JoinData;

	readonly j1!: Joinee;
	readonly j2!: Joinee;
	readonly f!: number;

	constructor(joiner: Joiner, p1: Piece, p2: Piece) {
		const { $oriented, s1, s2, q1, q2 } = this.joiner = joiner;
		let size = p1.sx + p2.sx;

		const builder1 = new JoineeBuilder(p1, q1, joiner);
		const builder2 = new JoineeBuilder(p2, q2, joiner);

		// Calculate the starting point of relay join
		if(s1) size += builder1.$setup(builder2, 1, s1);
		if(s2) size += builder2.$setup(builder1, -1, s2);
		if(isNaN(size)) return;

		let offset: IPoint | undefined;
		if(!$oriented) builder2.$additionalOffset = offset = { x: p1.sx - p2.sx, y: p1.sy - p2.sy };

		// Gather important parameters
		const pt = s1 ? builder1.$anchor : builder2.$anchor;
		const bv = Vector.$bisector(p1.$direction, p2.$direction);
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
	protected _setupDetour(dt1: Point[], dt2: Point[]): void {
		const { j1, j2 } = this;
		const shouldReverse2 = this.joiner.$isClockwise;
		j1.$setupDetour(dt1, !shouldReverse2);
		j2.$setupDetour(dt2, shouldReverse2);
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

	/** Generated {@link JoinResult}. */
	protected _result(json?: boolean, extraSize?: number): JoinResult {
		const { offset, size, addOns } = this.data;
		const { j1, j2 } = this;
		this.data.addOns = undefined;
		return [
			{
				gadgets: [j1.$toGadget(json), j2.$toGadget(json, offset)],
				addOns,
			},
			size + (extraSize ?? 0) * EXTRA_SIZE_WEIGHT,
		];
	}
}
