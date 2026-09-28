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

/** An axis-aligned rectangle, with `x1 <= x2` and `y1 <= y2`. */
export interface Rect {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
}

type Axis = "x" | "y";

function toRect(p: IPoint, q: IPoint): Rect {
	return { x1: Math.min(p.x, q.x), y1: Math.min(p.y, q.y), x2: Math.max(p.x, q.x), y2: Math.max(p.y, q.y) };
}

function rectContains(rect: Rect, p: IPoint): boolean {
	return rect.x1 <= p.x && p.x <= rect.x2 && rect.y1 <= p.y && p.y <= rect.y2;
}

/** The edge of the rectangle on the given axis, in the given direction (sign). */
function rectEdge(rect: Rect, axis: Axis, sign: number): number {
	if(axis == "x") return sign > 0 ? rect.x2 : rect.x1;
	return sign > 0 ? rect.y2 : rect.y1;
}

/** The result of {@link Quadrant.$startPointFor}. */
export interface NodeStart {
	/** The starting point of tracing. */
	point: Point;
	/** The region filled by the flaps inside the node, if the starting point is shifted. */
	filled?: Rect;
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
		return this._startEndPoints(this.o);
	}

	/**
	 * The starting point of tracing for the contour of a specific node (given by its leaves).
	 *
	 * The junctions with flaps inside the node do not show up on the contour of the node.
	 * Instead, the regions of those flaps (their own rough contours) fill up the region next to the hinge
	 * starting from the tracing starting point, and the pattern actually emerges from where the filling ends
	 * (which is at most where the first junction with a flap outside the node starts).
	 * Notice that the covered junctions (which are not in the {@link Repository}) also count here,
	 * so we have to consult all the {@link ValidJunction}s of the flap.
	 *
	 * Returns the shifted starting point, along with the region filled (if any).
	 */
	public $startPointFor(leaves: ReadonlySet<NodeId>): NodeStart {
		const start = this.$startEndPoints[0];
		const { regions, outside } = this._collectRegions(leaves);
		if(!regions.length || !outside.length) return { point: start };

		// The farthest that the starting point could be shifted to
		const limit = this._startEndPoints({
			x: Math.max(...outside.map(j => j.$o.x)),
			y: Math.max(...outside.map(j => j.$o.y)),
		})[0];

		// Work in the 1D coordinates along the hinge (a) and into the flap (d)
		const reversed = this.q % 2 != SlashDirection.FW;
		const a: Axis = reversed ? "x" : "y";
		const d: Axis = reversed ? "y" : "x";
		const sign = this.f[a]; // Towards the corner along the hinge
		const into = -this.f[d]; // Into the flap
		const at = (v: number): IPoint => a == "x" ? { x: v, y: start.y } : { x: start.x, y: v };

		// Walk along the hinge towards the corner, as long as the current point is covered by some region
		let cursor = start[a];
		let depth = 0;
		while(cursor != limit[a]) {
			// Among the covering regions, take the one reaching the farthest along the hinge
			let far: number | undefined;
			for(const rect of regions) {
				if(!rectContains(rect, at(cursor))) continue;
				const edge = rectEdge(rect, a, sign);
				if(far === undefined || sign * (edge - far) > 0) far = edge;
				depth = Math.max(depth, into * (rectEdge(rect, d, into) - start[d]));
			}
			if(far === undefined || sign * (far - cursor) <= 0) break;
			cursor = sign * (far - limit[a]) > 0 ? limit[a] : far;
		}
		if(cursor == start[a]) return { point: start };

		const point = new Point(at(cursor));
		const inner = { ...at(cursor), [d]: start[d] + into * depth };
		return { point, filled: toRect(start, inner) };
	}

	/**
	 * Collect the regions (i.e. the rough contours) of the flaps inside the node (given by its leaves)
	 * having junctions with this flap in this quadrant, and the junctions with flaps outside the node.
	 */
	private _collectRegions(leaves: ReadonlySet<NodeId>): { regions: Rect[], outside: ValidJunction[] } {
		const flap = this.$flap;
		const regions: Rect[] = [];
		const outside: ValidJunction[] = [];
		for(const j of State.$junctions.values()) {
			if(!j.$valid || !j.$involves(flap.id)) continue;
			if(getQuadrant(j.$a === flap ? j.$q1 : j.$q2) != this.q) continue;
			const id = this._getOppositeId(j);
			if(!leaves.has(id)) {
				outside.push(j);
				continue;
			}
			const inside = State.m.$tree.$nodes[id]!;
			const [t, r, b, l] = inside.$AABB.$toValues();
			const e = inside.$length;
			regions.push({ x1: l - e, y1: b - e, x2: r + e, y2: t + e });
		}
		return { regions, outside };
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
 * Find the starting {@link Point} of tracing for the contour of a specific node
 * (see {@link Quadrant.$startPointFor}) for a given set of {@link Quadrant}s.
 */
export function startPointFor(quadrants: Quadrant[], leaves: ReadonlySet<NodeId>): NodeStart {
	let start = quadrants[0].$startPointFor(leaves);
	const f = quadrants[0].f;
	for(let i = 1; i < quadrants.length; i++) {
		const newStart = quadrants[i].$startPointFor(leaves);
		if(pointWeight(newStart.point, f) < pointWeight(start.point, f)) start = newStart;
	}
	return start;
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
