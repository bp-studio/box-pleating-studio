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

type Axis = "x" | "y";

/** The result of {@link Quadrant.$resolveStartEnd}. */
export interface QuadrantStartEnd {
	start: Point;
	end: Point;
	/**
	 * If defined, the starting point should be moved to the intersection ridge
	 * dividing the gadgets of these flaps.
	 */
	startDivision?: [NodeId, NodeId];
	/** Same as {@link startDivision}, for the ending point. */
	endDivision?: [NodeId, NodeId];
}

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

				// v0.6.17: if the delta point of any two junctions falls
				// inside the circle, then this quadrant is clearly invalid.
				const offset = getDeltaPointOffsetFromCorner(j1, j2);
				const n1 = this._getOppositeId(j1);
				const n2 = this._getOppositeId(j2);
				const r = nodeSet.$distTriple(n1, n2, this.$flap.id).d3;
				const deltaPt = new Vector(r - offset.x, r - offset.y);
				const deltaPtDist = deltaPt.$length;
				if(deltaPtDist < r) return false;
			}
		}
		return true;
	}

	public get $startEndPoints(): [Point, Point] {
		return this._startEndPoints(this.o);
	}

	/**
	 * Resolve the starting/ending points of tracing for the contour of a node
	 * (given by its leaves).
	 *
	 * The junctions with flaps inside the node (i.e. wrapped by the river of
	 * the node) do not show up on the contour of the node, as they are
	 * digested by the inner flaps. So only the junctions with flaps outside the
	 * node determine the starting/ending points, and where the gadget of such a
	 * junction is adjacent to the gadget of an inner junction, the
	 * starting/ending point should be moved to the intersection ridge between
	 * the two gadgets instead (the actual location is resolved by
	 * {@link RepoTrace} using the returned pair of flap ids).
	 *
	 * Returns `null` if all junctions of this quadrant are with inner flaps, in
	 * which case this quadrant does not participate in the tracing of the node
	 * at all.
	 */
	public $resolveStartEnd(
		leaves: ReadonlySet<NodeId>
	): QuadrantStartEnd | null {
		const inside: ValidJunction[] = [];
		const outside: ValidJunction[] = [];
		for(const junction of this._junctions) {
			const isInside = leaves.has(this._getOppositeId(junction));
			(isInside ? inside : outside).push(junction);
		}
		if(!outside.length) return null;

		const o = {
			x: Math.max(...outside.map(j => j.$o.x)),
			y: Math.max(...outside.map(j => j.$o.y)),
		};
		const [start, end] = this._startEndPoints(o);
		if(!inside.length) return { start, end };

		// The starting side corresponds to one of the axes (see
		// _startEndPoints), and the ending side the other
		const reversed = this.q % 2 != SlashDirection.FW;
		const startAxis: Axis = reversed ? "x" : "y";
		const endAxis: Axis = reversed ? "y" : "x";
		return {
			start, end,
			startDivision: this._findNeighbor(inside, outside, o, startAxis),
			endDivision: this._findNeighbor(inside, outside, o, endAxis),
		};
	}

	/**
	 * Find the inner junction adjacent to the outer junctions on the given side
	 * (if any), and return the ids of the two flaps whose gadgets are divided
	 * by the intersection ridge in between.
	 */
	private _findNeighbor(
		inside: ValidJunction[], outside: ValidJunction[], o: IPoint, axis: Axis
	): [NodeId, NodeId] | undefined {
		let neighbor: ValidJunction | undefined;
		for(const j of inside) {
			const v = j.$o[axis];
			if(v > o[axis] && (!neighbor || v < neighbor.$o[axis])) {
				neighbor = j;
			}
		}
		if(!neighbor) return undefined;
		const last = outside.find(j => j.$o[axis] == o[axis])!;
		return [this._getOppositeId(last), this._getOppositeId(neighbor)];
	}

	private _startEndPoints(o: IPoint): [Point, Point] {
		const r = this.$flap.$length;
		const { x, y } = o;
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
	 * @param junction The parent {@link JJunction} from which {@link ov}
	 * derives.
	 * @param q Which corner (before transformation) to get
	 * @param d Additional distance
	 */
	public $getOverlapCorner(
		ov: JOverlap, junction: JJunction, q: QuadrantDirection, d: number
	): Point {
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

	////////////////////////////////////////////////////////////////////////////
	// Private methods
	////////////////////////////////////////////////////////////////////////////

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

export const minQuadrantWeightComparator: Comparator<Quadrant> =
	(a, b) => a.w - b.w;

/**
 * The weight for sorting points from the perspective of a given quadrant.
 * In particular, it will sort the points in counter-clockwise ordering.
 * @param p The {@link IPoint} to compare.
 * @param f The directional factor of the {@link Quadrant}.
 */
export function pointWeight(p: IPoint, f: IPoint): number {
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

function getDeltaPointOffsetFromCorner(
	j1: ValidJunction, j2: ValidJunction
): IPoint {
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
 * parseTree(
 * 	"(0,1,10),(0,2,10),(0,3,1)",
 * 	"(1,0,0,0,0),(2,16,16,0,0),(3,9,7,0,0)"
 * );
 * ```
 */
function oneIsContainedInAnother(o1: IPoint, o2: IPoint): boolean {
	return o1.x <= o2.x && o1.y <= o2.y || o2.x <= o1.x && o2.y <= o1.y;
}
