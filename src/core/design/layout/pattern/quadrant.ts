import { Point } from "core/math/geometry/point";
import { Direction, SlashDirection } from "shared/types/direction";
import { MASK } from "../junction/validJunction";
import { State } from "core/service/state";

import type { ValidJunction } from "../junction/validJunction";
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

	/** The starting point of tracing relative to the corner of the flap. */
	private readonly o: IPoint;

	constructor(code: number, junctions: ValidJunction[]) {
		this.$flap = State.$tree.$nodes[code >>> 2]!;
		this.q = code & MASK;
		this.f = {
			x: this.q == Direction.UR || this.q == Direction.LR ? 1 : -1,
			y: this.q == Direction.UR || this.q == Direction.UL ? 1 : -1,
		};

		const ox: number[] = [], oy: number[] = [];
		for(const junction of junctions) {
			ox.push(junction.$o.x);
			oy.push(junction.$o.y);
		}
		this.o = { x: Math.max(...ox), y: Math.max(...oy) };
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
	public $getOverlapCorner(ov: JOverlap, junction: JJunction, q: number, d: number): Point {
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

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Private methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Get the y-coordinate that is `d` units away from the tip.
	 */
	private y(d: number): number {
		return this.$point.y + this.f.y * d;
	}

	/**
	 * Get the x-coordinate that is `d` units away from the tip.
	 */
	private x(d: number): number {
		return this.$point.x + this.f.x * d;
	}
}

/**
 * Find the start/end {@link Point}s for tracing for a given set of {@link Quadrant}s
 * (assumed to be of the same {@link QuadrantDirection}).
 */
export function startEndPoints(quadrants: Quadrant[]): [Point, Point] {
	let [start, end] = quadrants[0].$startEndPoints;
	const f = quadrants[0].f.y;
	for(let i = 1; i < quadrants.length; i++) {
		const [newStart, newEnd] = quadrants[i].$startEndPoints;
		if(newStart.x * f > start.x * f) start = newStart;
		if(newEnd.x * f < end.x * f) end = newEnd;
	}
	return [start, end];
}
