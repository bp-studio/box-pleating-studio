import { Point } from "core/math/geometry/point";
import { Direction, quadrantNumber } from "shared/types/direction";
import { MASK } from "../junction/validJunction";
import { State } from "core/service/state";
import { Vector } from "core/math/geometry/vector";

import type { Fraction } from "core/math/fraction";
import type { ITreeNode } from "core/design/context";
import type { Pattern } from "./pattern";
import type { QuadrantDirection } from "shared/types/direction";
import type { JOverlap } from "shared/json/layout";
import type { JJunction } from "shared/json/pattern";

//=================================================================
/**
 * {@link Quadrant} handles the calculations related to a single quadrant of a flap.
 */
//=================================================================

export class Quadrant {

	public readonly $flap: ITreeNode;
	public readonly q: QuadrantDirection;
	public readonly f: IPoint;

	constructor(code: number) {
		this.$flap = State.$tree.$nodes[code >>> 2]!;
		this.q = code & MASK;
		this.f = {
			x: this.q == Direction.UR || this.q == Direction.LR ? 1 : -1,
			y: this.q == Direction.UR || this.q == Direction.UL ? 1 : -1,
		};
	}

	/**
	 * In case there are rivers, calculate the corner of the overlap region.
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
	 * Flap tip of this {@link Quadrant}.
	 */
	public get $point(): IPoint {
		return this.$flap.$AABB.$points[this.q];
	}

	/**
	 * Get the y-coordinate that is `d` units away from the tip.
	 */
	public y(d: number): number {
		return this.$point.y + this.f.y * d;
	}

	/**
	 * Get the x-coordinate that is `d` units away from the tip.
	 */
	public x(d: number): number {
		return this.$point.x + this.f.x * d;
	}

	public $getStart(d: Fraction): Point {
		return new Point(this.$point).$add(SV[this.q].$scale(d));
	}

	public $getEnd(d: Fraction): Point {
		return new Point(this.$point).$add(SV[(this.q + 1) % quadrantNumber].$scale(d));
	}
}

const QV: readonly Vector[] = [
	new Vector(1, 1),
	new Vector(-1, 1),
	new Vector(-1, -1),
	new Vector(1, -1),
];

const SV: readonly Vector[] = [
	new Vector(1, 0),
	new Vector(0, 1),
	new Vector(-1, 0),
	new Vector(0, -1),
];
