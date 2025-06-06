import { Point } from "core/math/geometry/point";
import { Direction, SlashDirection, getNodeId, getQuadrant } from "shared/types/direction";
import { State } from "core/service/state";
import { Vector } from "core/math/geometry/vector";

import type { NodeSet } from "../nodeSet";
import type { NodeId } from "shared/json/tree";
import type { Comparator } from "shared/types/types";
import type { Junctions, ValidJunction } from "../junction/validJunction";
import type { Repository } from "../repository";
import type { ITreeNode } from "core/design/context";
import type { QuadrantDirection, QuadrantCode, PerQuadrant } from "shared/types/direction";
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

	/**
	 * Weight for sorting {@link Quadrant}s in counter-clockwise ordering.
	 * See also {@link pointWeight}.
	 */
	public readonly w: number;

	/** The starting point of tracing relative to the corner of the flap. */
	private readonly o: IPoint;

	private readonly _junctions: Junctions;

	constructor(code: QuadrantCode, junctions: Junctions) {
		this.$flap = State.m.$tree.$nodes[getNodeId(code)]!;
		this.q = getQuadrant(code);
		this.f = getFactors(this.q);
		this._junctions = junctions;

		const ox: number[] = [], oy: number[] = [];
		for(let i = 0; i < junctions.length; i++) {
			const junction = junctions[i];
			ox.push(junction.$o.x);
			oy.push(junction.$o.y);
		}
		this.o = { x: Math.max(...ox), y: Math.max(...oy) };

		// Weight is relatively invariant as the entire repo moves,
		// so can be calculated as constant.
		this.w = pointWeight(this.$point, this.f);
	}

	/** Basic validity checks. */
	public $checkValidity(nodeSet: NodeSet): boolean {
		for(let i = 0; i < this._junctions.length; i++) {
			const j1 = this._junctions[i];
			for(let j = i + 1; j < this._junctions.length; j++) {
				const j2 = this._junctions[j];
				if(oneIsContainedInAnother(j1.$o, j2.$o)) return false;

				// v0.6.17: if the delta point of any two junctions falls inside the circle,
				// then this quadrant is clearly invalid.
				const offset = getDeltaPointOffsetFromCorner(j1, j2);
				const n1 = this._getOppositeId(j1);
				const n2 = this._getOppositeId(j2);
				const r = nodeSet.$distTriple(n1, n2, this.$flap.id).d3;
				const deltaPtDist = new Vector(r - offset.x, r - offset.y).$length;
				if(deltaPtDist < r) return false;
			}
		}
		return true;
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

	private _getOppositeId(j: ValidJunction): NodeId {
		return j.$a.id == this.$flap.id ? j.$b.id : j.$a.id;
	}
}

export const minQuadrantWeightComparator: Comparator<Quadrant> = (a, b) => a.w - b.w;

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

/**
 * The weight for sorting points from the perspective of a given quadrant.
 * In particular, it will sort the points in counter-clockwise ordering.
 * @param p The {@link IPoint} to compare.
 * @param f The directional factor of the {@link Quadrant}.
 */
function pointWeight(p: IPoint, f: IPoint): number {
	return f.x * p.y - f.y * p.x;
}

export const QV = [
	new Vector(1, 1),
	new Vector(-1, 1),
	new Vector(-1, -1),
	new Vector(1, -1),
] as PerQuadrant<Vector>;

export function getFactors(q: QuadrantDirection): ISignPoint {
	return {
		x: q == Direction.UR || q == Direction.LR ? 1 : -1,
		y: q == Direction.UR || q == Direction.UL ? 1 : -1,
	};
}

function getDeltaPointOffsetFromCorner(j1: ValidJunction, j2: ValidJunction): IPoint {
	return {
		x: Math.min(j1.$o.x, j2.$o.x),
		y: Math.min(j1.$o.y, j2.$o.y),
	};
}

/**
 * v0.7.0: If one of the overlap rectangle is fully contained inside another
 * (but not considered covered by our covering rules),
 * then this is currently not supported and we can skip searching.
 *
 * To resolve such a junction team, sophisticated cutting is required,
 * and we need more insights on such cases to implement the cutting algorithm.
 *
 * A classic example of this is the following:
 * ```
 * parseTree("(0,1,10),(0,2,10),(0,3,1)", "(1,0,0,0,0),(2,16,16,0,0),(3,9,7,0,0)");
 * ```
 */
function oneIsContainedInAnother(o1: IPoint, o2: IPoint): boolean {
	return o1.x <= o2.x && o1.y <= o2.y || o2.x <= o1.x && o2.y <= o1.y;
}
