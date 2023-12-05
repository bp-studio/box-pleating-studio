import { Strategy } from "shared/json";
import { Direction } from "shared/types/direction";
import { Vector } from "core/math/geometry/vector";
import { generate } from "core/math/gops";
import { Piece } from "../pattern/piece";
import { SimpleJoinLogic } from "./logic/simpleJoinLogic";
import { BaseJoinLogic } from "./logic/baseJoinLogic";
import { StandardJoinLogic } from "./logic/standardJoinLogic";

import type { JoinLogic, JoinResult } from "./logic/joinLogic";
import type { Repository } from "../repository";
import type { JOverlap, JDevice, JJunction, JPiece } from "shared/json";
import type { QuadrantDirection } from "shared/types/direction";
import type { Point } from "core/math/geometry/point";

//=================================================================
/**
 * {@link Joiner} search for possible {@link Gadget}s and cache them during joining.
 */
//=================================================================

export class Joiner {

	private readonly g1!: readonly JPiece[];
	private readonly g2!: readonly JPiece[];

	/** Shifting of the first {@link JOverlap}. */
	public readonly s1?: IPoint;

	/** Shifting of the second {@link JOverlap}. */
	public readonly s2?: IPoint;

	/** Sharing the lower-left corner. */
	public readonly $oriented!: boolean;

	/** It is clockwise from {@link g1} to {@link g2}. */
	public readonly $isClockwise!: boolean;

	/** See {@link Repository.$getMaxIntersectionDistance}. */
	public readonly $intersectionDist!: number;

	// Edge combinations in the 4 cases.
	public readonly q1!: QuadrantDirection;
	public readonly q2!: QuadrantDirection;

	/** Direction of the shared corner. */
	public readonly q!: QuadrantDirection;

	constructor(overlaps: readonly JOverlap[], repo: Repository) {
		const junctions: JJunction[] = [];
		const [o1, o2] = overlaps;
		if(o1.ox == o2.ox || o1.oy == o2.oy) return; // No need to continue in this case

		//TODO: allowing pass in a predefined list of pieces for better performance
		[this.g1, this.g2] = overlaps.map(o => {
			const j = repo.$junctions[o.parent];
			junctions.push(j);
			return Array.from(generate(o.ox, o.oy, j.sx));
		});

		const [j1, j2] = junctions;
		this.$oriented = j1.c[0].e == j2.c[0].e;
		this.$isClockwise = o1.ox > o2.ox;
		this.q = this.$oriented ? 0 : 2;
		[this.q1, this.q2] = this._getQuadrantCombination();
		this.$intersectionDist = repo.$getMaxIntersectionDistance(j1, j2, this.$oriented);

		// Calculate Overlap shifting
		[this.s1, this.s2] = this.$oriented ?
			[o1.shift, o2.shift] :
			[Joiner._getReverseShift(o1, j1), Joiner._getReverseShift(o2, j2)];
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public *$simpleJoin(strategy?: Strategy): Generator<JDevice> {
		const { s1, s2 } = this;
		yield* this.join(SimpleJoinLogic, (P1, P2) => {
			const parallel = P1.$direction.$parallel(P2.$direction);
			if(strategy == Strategy.perfect && !parallel) return false;
			if((s1 || s2) && parallel) return false;
			return true;
		});
	}

	public *$baseJoin(): Generator<JDevice> {
		yield* this.join(BaseJoinLogic);
	}

	public *$standardJoin(): Generator<JDevice> {
		const { s1, s2 } = this, shift = Boolean(s1) || Boolean(s2);
		let counter = 0;
		yield* this.join(
			StandardJoinLogic,
			(P1, P2) => shift || counter++ == 0 // Return only the first one
		);
	}

	public $getRelayJoinIntersection(piece: Piece, shift: IPoint,
		q: QuadrantDirection): Point | null {
		const testVector = this.$oriented ? new Vector(1, 1) : new Vector(-1, -1);
		const pt = piece.$anchors[this.q]!.sub(new Vector(shift));
		return piece.$shape.ridges[q].$intersection(pt, testVector);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	private *join<T extends JoinLogic>(
		Logic: new (joiner: Joiner, p1: Piece, p2: Piece) => T,
		precondition?: (P1: Piece, P2: Piece) => boolean
	): Generator<JDevice> {
		const { g1, g2 } = this;
		const result: JoinResult[] = [];
		if(!g1) return;
		for(const p1 of g1) {
			for(const p2 of g2) {
				const P1 = new Piece(p1);
				const P2 = new Piece(p2);
				if(precondition && !precondition(P1, P2)) continue;
				result.push(...new Logic(this, P1, P2).$join());
			}
		}
		result.sort((a, b) => a[1] - b[1]);
		for(const [j] of result) yield j;
	}

	private _getQuadrantCombination(): [QuadrantDirection, QuadrantDirection] {
		if(this.$oriented) {
			return this.$isClockwise ? [Direction.LL, Direction.UL] : [Direction.UL, Direction.LL];
		} else {
			return this.$isClockwise ? [Direction.UR, Direction.LR] : [Direction.LR, Direction.UR];
		}
	}

	private static _getReverseShift(o: JOverlap, j: JJunction): IPoint | undefined {
		const x = o.ox + (o.shift?.x ?? 0), y = o.oy + (o.shift?.y ?? 0);
		if(x == j.ox && y == j.oy) return undefined;
		return { x: x - j.ox, y: y - j.oy }; // We return negative value on purpose here
	}
}
