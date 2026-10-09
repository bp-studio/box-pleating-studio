import { JoinStrategy } from "shared/json";
import { Direction } from "shared/types/direction";
import { Vector } from "core/math/geometry/vector";
import { getJoinCandidates, restoreCandidates } from "./joinCandidate";
import { Piece } from "../pattern/piece";
import { SimpleJoinLogic } from "./logic/simpleJoinLogic";
import { BaseJoinLogic } from "./logic/baseJoinLogic";
import { StandardJoinLogic } from "./logic/standardJoinLogic";
import { QV } from "../pattern/quadrant";

import type { JoinLogic, JoinResult } from "./logic/joinLogic";
import type { Repository } from "../repository";
import type { JoinCandidate } from "./joinCandidate";
import type { JOverlap, JDevice, JJunction } from "shared/json";
import type { QuadrantDirection } from "shared/types/direction";
import type { Point } from "core/math/geometry/point";

//=================================================================
/**
 * {@link Joiner} search for possible {@link Gadget}s and cache them during
 * joining.
 */
//=================================================================

export class Joiner {

	private readonly g1!: readonly JoinCandidate[];
	private readonly g2!: readonly JoinCandidate[];

	/** Shifting of the first {@link JOverlap}. */
	public readonly s1?: IPoint;

	/** Shifting of the second {@link JOverlap}. */
	public readonly s2?: IPoint;

	/**
	 * Sharing the lower-left corner, as opposed to the upper-right corner.
	 */
	public readonly $oriented!: boolean;

	/** It is clockwise from {@link g1} to {@link g2}. */
	public readonly $isClockwise!: boolean;

	/** See {@link Repository.$getMaxIntersectionDistance}. */
	public readonly $intersectionDist!: number;

	// Edge combinations in the 4 cases.
	public readonly q1!: QuadrantDirection;
	public readonly q2!: QuadrantDirection;

	// The width of SCR for the two original junctions.
	public readonly w1!: number;
	public readonly w2!: number;

	/** Direction of the shared corner. */
	public readonly q!: QuadrantDirection;

	constructor(overlaps: readonly JOverlap[], repo: Repository) {
		const [o1, o2] = overlaps;
		// No need to continue in this case
		if(o1.ox == o2.ox || o1.oy == o2.oy) return;

		const [j1, j2] = overlaps.map(o => repo.$junctions[o.parent]);
		this.$oriented = j1.c[0].e == j2.c[0].e;
		this.q = this.$oriented ? 0 : 2;

		// Calculate Overlap shifting
		[this.s1, this.s2] = this.$oriented ?
			[o1.shift, o2.shift] :
			[getReverseShift(o1, j1), getReverseShift(o2, j2)];

		// In relayed joins (see _makeRelayedJoin), both overlaps are cut by the
		// same amount, so they still share a corner, and they are joined as
		// usual there. The joining is invariant under the translation, except
		// for the delta point, which is computed from the sizes of the cut
		// overlaps correctly up to a translation along the diagonal (which
		// doesn't matter for the delta line).
		const { s1, s2 } = this;
		if(s1 && s2 && s1.x == s2.x && s1.y == s2.y) {
			[this.s1, this.s2] = [undefined, undefined];
		}

		// Compare the extents from the joint, as one of the overlaps could be
		// shortened in relay joins.
		const x1 = o1.ox + Math.abs(this.s1?.x ?? 0);
		const x2 = o2.ox + Math.abs(this.s2?.x ?? 0);
		this.$isClockwise = x1 > x2;

		[this.q1, this.q2] = this._getQuadrantCombination();

		//TODO: allowing pass in a predefined list of pieces
		// for better performance
		[this.g1, this.g2] = [o1, o2].map((o, i) => Array.from(
			getJoinCandidates(o, [j1, j2][i].sx, this.q, [this.q1, this.q2][i])
		));
		this.$intersectionDist =
			repo.$getMaxIntersectionDistance(j1, j2, this.$oriented);
		this.w1 = j1.sx;
		this.w2 = j2.sx;
	}

	////////////////////////////////////////////////////////////////////////////
	// Public methods
	////////////////////////////////////////////////////////////////////////////

	/**
	 * The {@link JoinCandidate}s of the first {@link JOverlap}.
	 *
	 * Note that there's none if the two {@link JOverlap}s have the same width
	 * or height (see the constructor). In that case one of them contains the
	 * other with a common side, which is allowed by Quadrant.$checkValidity
	 * for relaying, but they cannot be joined. This happens in fans, where the
	 * one in the middle could be nested in both of the others.
	 */
	public get $firstCandidates(): readonly JoinCandidate[] {
		return this.g1 ?? [];
	}

	/**
	 * Joins of the given strategy.
	 *
	 * @param first If given, only this {@link JoinCandidate} will be used for
	 * the first {@link JOverlap}.
	 */
	public *$join(
		strategy: JoinStrategy, first?: JoinCandidate
	): Generator<JDevice> {
		if(strategy == JoinStrategy.standardJoin) {
			yield* this.$standardJoin(first);
		} else if(strategy == JoinStrategy.baseJoin) {
			yield* this.$baseJoin(first);
		} else {
			yield* this.$simpleJoin(strategy, first);
		}
	}

	/**
	 * Simple joins, including perfect joins, which are distinguished by whether
	 * the axis-parallel creases of the two gadgets are parallel.
	 */
	public *$simpleJoin(
		strategy: JoinStrategy.simple | JoinStrategy.perfect,
		first?: JoinCandidate
	): Generator<JDevice> {
		const { s1, s2 } = this;
		const perfect = strategy == JoinStrategy.perfect;
		yield* this.join(SimpleJoinLogic, (P1, P2) => {
			const parallel = P1.$direction.value.$parallel(P2.$direction.value);
			if(parallel != perfect) return false;

			// Relay joins cannot be perfect
			return !(s1 || s2) || !parallel;
		}, first);
	}

	public *$baseJoin(first?: JoinCandidate): Generator<JDevice> {
		yield* this.join(BaseJoinLogic, undefined, first);
	}

	public *$standardJoin(first?: JoinCandidate): Generator<JDevice> {
		const { s1, s2 } = this, shift = Boolean(s1) || Boolean(s2);
		let counter = 0;
		yield* this.join(
			StandardJoinLogic,
			(P1, P2) => shift || counter++ == 0, // Return only the first one
			first
		);
	}

	public $getRelayJoinIntersection(piece: Piece, shift: IPoint,
		q: QuadrantDirection): Point | null {
		const testVector = this.$oriented ? QV[Direction.UR] : QV[Direction.LL];
		const pt = piece.$anchors.value[this.q]!.$sub(new Vector(shift));
		return piece.$shape.value.ridges[q].$intersection(pt, testVector);
	}

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

	private *join<T extends JoinLogic>(
		Logic: new (joiner: Joiner, p1: Piece, p2: Piece) => T,
		precondition?: (P1: Piece, P2: Piece) => boolean,
		first?: JoinCandidate
	): Generator<JDevice> {
		const { g1, g2 } = this;
		const result: JoinResult[] = [];
		if(!g1) return;
		for(const c1 of first ? [first] : g1) {
			for(const c2 of g2) {
				// The joining only concerns the main pieces
				const P1 = new Piece(c1.piece);
				const P2 = new Piece(c2.piece);
				if(precondition && !precondition(P1, P2)) continue;
				for(const [device, weight] of new Logic(this, P1, P2).$join()) {
					const restored = restoreCandidates(device, [c1, c2]);
					if(restored) result.push([restored, weight]);
				}
			}
		}
		result.sort((a, b) => a[1] - b[1]);
		for(const [j] of result) yield j;
	}

	private _getQuadrantCombination(): [QuadrantDirection, QuadrantDirection] {
		if(this.$oriented) {
			return this.$isClockwise ?
				[Direction.LL, Direction.UL] : [Direction.UL, Direction.LL];
		} else {
			return this.$isClockwise ?
				[Direction.UR, Direction.LR] : [Direction.LR, Direction.UR];
		}
	}
}

function getReverseShift(o: JOverlap, j: JJunction): IPoint | undefined {
	const x = o.ox + (o.shift?.x ?? 0), y = o.oy + (o.shift?.y ?? 0);
	if(x == j.ox && y == j.oy) return undefined;
	// We return negative value on purpose here
	return { x: x - j.ox, y: y - j.oy };
}
