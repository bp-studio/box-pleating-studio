import { Point } from "core/math/geometry/point";
import { Direction, SlashDirection } from "shared/types/direction";
import { MASK } from "../junction/validJunction";
import { State } from "core/service/state";
import { Vector } from "core/math/geometry/vector";

import type { NodeId } from "shared/json";
import type { Comparator } from "shared/types/types";
import type { Junctions } from "../junction/validJunction";
import type { Repository } from "../repository";
import type { ITreeNode } from "core/design/context";
import type { QuadrantDirection } from "shared/types/direction";
import type { JOverlap } from "shared/json/layout";
import type { JJunction } from "shared/json/pattern";

//=================================================================
/**
 * {@link Quadrant} handles the calculations related to a single quadrant
 * of a flap in a specific {@link Repository}.
 */
//=================================================================
export class Quadrant {

	public readonly $flap: ITreeNode;
	public readonly q: QuadrantDirection;
	public readonly f: IPoint;

	/** Weight for sorting {@link Quadrant}s. */
	public readonly w: number;

	/** The starting point of tracing relative to the corner of the flap. */
	private readonly o: IPoint;

	constructor(code: number, junctions: Junctions) {
		this.$flap = State.$tree.$nodes[(code >>> 2) as NodeId]!;
		this.q = code & MASK;
		this.f = getFactors(this.q);

		const ox: number[] = [], oy: number[] = [];
		for(const junction of junctions) {
			ox.push(junction.$o.x);
			oy.push(junction.$o.y);
		}
		this.o = { x: Math.max(...ox), y: Math.max(...oy) };

		// Weight is relatively invariant as the entire repo moves,
		// so can be calculated as constant.
		this.w = pointWeight(this.$point, this.f);
	}

	public get $startEndPoints(): [Point, Point] {
		const r = this.$flap.$length;
		const { x, y } = this.o;
		const result: [Point, Point] = [
			new Point(this.x(r), this.y(r - y)),
			new Point(this.x(r - x), this.y(r)),
		];
		if(this.q % 2 != SlashDirection.FW) result.reverse();
		return result;
	}

	/**
	 * In case there are rivers, calculate the corner of the overlap region.
	 * @param ov The {@link JOverlap} to calculate.
	 * @param junction The parent {@link JJunction} from which {@link ov} derives.
	 * @param q Which corner (before transformation) to get
	 * @param d Additional distance
	 */
	public $getOverlapCorner(ov: JOverlap, junction: JJunction, q: QuadrantDirection, d: number): Point {
		const r = this.$flap.$length + d;
		let sx = ov.shift?.x ?? 0;
		let sy = ov.shift?.y ?? 0;

		// If the current quadrant is on the opposite end of the junction,
		// the location will have to be reversed as well.
		if(this.$flap.id != junction.c[0].e) {
			sx = junction.ox - (ov.ox + sx);
			sy = junction.oy - (ov.oy + sy);
		}

		return new Point(
			this.x(r - (q == Direction.LR ? 0 : ov.ox) - sx),
			this.y(r - (q == Direction.UL ? 0 : ov.oy) - sy)
		);
	}

	/**
	 * Flap tip (not the corner) of this {@link Quadrant}.
	 */
	public get $point(): IPoint {
		return this.$flap.$AABB.$points[this.q];
	}

	/**
	 * Hinge corner of this {@link Quadrant} by a given radius.
	 */
	public $corner(r: number): IPoint {
		return { x: this.x(r), y: this.y(r) };
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Get the y-coordinate that is {@link d} units away from the tip.
	 */
	private y(d: number): number {
		return this.$point.y + this.f.y * d;
	}

	/**
	 * Get the x-coordinate that is {@link d} units away from the tip.
	 */
	private x(d: number): number {
		return this.$point.x + this.f.x * d;
	}
}

export const quadrantComparator: Comparator<Quadrant> = (a, b) => a.w - b.w;

/**
 * Find the start/end {@link Point}s for tracing for a given set of {@link Quadrant}s
 * (assumed to be of the same {@link QuadrantDirection}).
 */
export function startEndPoints(quadrants: Quadrant[]): [Point, Point] {
	let [start, end] = quadrants[0].$startEndPoints;
	const f = quadrants[0].f;
	for(let i = 1; i < quadrants.length; i++) {
		const [newStart, newEnd] = quadrants[i].$startEndPoints;
		if(pointWeight(newStart, f) < pointWeight(start, f)) start = newStart;
		if(pointWeight(newEnd, f) > pointWeight(end, f)) end = newEnd;
	}
	return [start, end];
}

function pointWeight(p: IPoint, f: IPoint): number {
	return f.x * p.y - f.y * p.x;
}

export const QV: readonly Vector[] = [
	new Vector(1, 1),
	new Vector(-1, 1),
	new Vector(-1, -1),
	new Vector(1, -1),
];

export function getFactors(q: QuadrantDirection): ISignPoint {
	return {
		x: q == Direction.UR || q == Direction.LR ? 1 : -1,
		y: q == Direction.UR || q == Direction.UL ? 1 : -1,
	};
}
