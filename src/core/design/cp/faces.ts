import { Fraction } from "core/math/fraction";
import { Line } from "core/math/geometry/line";
import { Vector } from "core/math/geometry/vector";
import { subdivide } from "core/math/geometry/subdivide";

import type { Point } from "core/math/geometry/point";
import type { SubdividedEdge, WithLine } from "core/math/geometry/subdivide";

/** The kinds of regions that are treated specially. */
export type Interior = "device" | "tip";

/** The direction of the axis-parallel creases in a face. */
export type Axis = "horizontal" | "vertical";

export interface Segment extends WithLine {
	/** Whether this is a segment of a hinge (i.e. a contour). */
	readonly hinge: boolean;
	/** Whether this is a segment of a ridge. */
	readonly ridge?: boolean;
	/**
	 * For a hinge, a guess of its depth, i.e. the distance to the root in the
	 * tree. Where the hinges overlap, the actual depth is the maximal guess
	 * (see {@link collectSegments}).
	 */
	readonly depth?: number;
	/**
	 * The kind of the region on the left of the line (going from
	 * {@link Line.p1} to {@link Line.p2}), if it is special.
	 */
	readonly left?: Interior;
}

/** A face of the planar subdivision formed by a set of {@link Segment}s. */
export interface Face {
	/** Whether some of the edges of the face are horizontal hinges. */
	$horizontalHinge: boolean;
	/** Whether some of the edges of the face are vertical hinges. */
	$verticalHinge: boolean;
	/** The kind of the face, if it is inside a special region. */
	$interior?: Interior;
	/**
	 * The direction of the axis-parallel creases in the face, if determined
	 * (see {@link resolveAxes}).
	 */
	$axis?: Axis;
	/**
	 * The parity of the creases in the face, if determined (see
	 * {@link resolveAxes}). That is, for the crease at the coordinate k (y for
	 * horizontal and x for vertical), the parity of k + {@link $phase} is the
	 * parity of x + y + D for any point on the crease, where D is the depth of
	 * the point. Such parity is constant along any crease.
	 */
	$phase?: number;
}

interface Vertex {
	readonly p: Point;
	/** The outgoing half-edges, sorted by their angles. */
	readonly out: HalfEdge[];
}

interface HalfEdge {
	readonly from: Vertex;
	readonly to: Vertex;
	readonly vector: Vector;
	readonly hinge: boolean;
	readonly ridge: boolean;
	/** The depth of the hinge. */
	readonly depth?: number;
	/** The kind of the region on the left. */
	readonly left?: Interior;
	twin: HalfEdge;
	next: HalfEdge;
	face: Face;
}

//=================================================================
/**
 * {@link FaceMap} is the planar subdivision formed by a set of
 * {@link Segment}s, which can locate the faces next to a given point.
 * All computations are exact.
 */
//=================================================================
export class FaceMap {

	private readonly _vertices = new Map<string, Vertex>();

	/** One of the two half-edges of each edge. */
	private readonly _edges: HalfEdge[] = [];

	constructor(segments: readonly Segment[]) {
		for(const edge of subdivide(segments)) this._addEdge(edge);
		const vertices = [...this._vertices.values()];

		// The next half-edge of the one from u to v is the half-edge leaving v
		// right after the twin in the clockwise order, so that each face is on
		// the left of its boundary.
		for(const v of vertices) {
			v.out.sort((a, b) => a.vector.$compareAngle(b.vector));
		}
		for(const h of vertices.flatMap(v => v.out)) {
			const out = h.to.out;
			const i = out.indexOf(h.twin);
			h.next = out[(i - 1 + out.length) % out.length];
		}

		const visited = new Set<HalfEdge>();
		const boundaries = new Map<Face, HalfEdge[]>();
		for(const start of vertices.flatMap(v => v.out)) {
			if(visited.has(start)) continue;
			const [face, edges] = createFace(start, visited);
			boundaries.set(face, edges);
		}
		resolveAxes(boundaries);
	}

	/**
	 * The face next to the given point, on the given side vertically.
	 * The point should not be a vertex, and if it lies on an edge, the edge
	 * should not be vertical. Returns `null` if it is the unbounded face.
	 *
	 * We cast a vertical ray from the point towards the given side, and find
	 * the first edge or vertex it hits.
	 */
	public $faceBeside(m: Point, f: Sign): Face | null {
		let hit: Point | null = null;
		let edge: HalfEdge | null = null;
		let min: Fraction | null = null;
		for(const h of this._edges) {
			const p = verticalHit(h, m, f);
			if(!p) continue;
			const d = p._y.sub(m._y).f(f);
			if(!min || d.lt(min)) {
				min = d;
				hit = p;
				edge = h;
			}
		}
		if(!hit || !edge || !min) return null;

		// The face containing the hit point shifted slightly towards the point,
		// or towards the given side if the point itself is hit.
		const d = new Vector(0, min.$numerator == 0 ? f : -f);
		const vertex = this._vertices.get(hit.toString());
		if(vertex) return sectorFace(vertex, d);
		const onLeft = edge.vector.$cross(d).$numerator > 0;
		return onLeft ? edge.face : edge.twin.face;
	}

	private _getVertex(p: Point): Vertex {
		const key = p.toString();
		let v = this._vertices.get(key);
		if(!v) this._vertices.set(key, v = { p, out: [] });
		return v;
	}

	private _addEdge(edge: SubdividedEdge<Segment>): void {
		const v1 = this._getVertex(edge.p1), v2 = this._getVertex(edge.p2);
		const depths = edge.sources
			.map(s => s.item.depth)
			.filter(d => d !== undefined);
		const kind = {
			hinge: edge.sources.some(s => s.item.hinge),
			ridge: edge.sources.some(s => s.item.ridge),
			depth: depths.length ? Math.max(...depths) : undefined,
		};
		const side = (forward: boolean): Interior | undefined => edge.sources
			.find(s => s.forward == forward && s.item.left)?.item.left;
		const h1 = createHalfEdge(v1, v2, { ...kind, left: side(true) });
		const h2 = createHalfEdge(v2, v1, { ...kind, left: side(false) });
		h1.twin = h2;
		h2.twin = h1;
		v1.out.push(h1);
		v2.out.push(h2);
		this._edges.push(h1);
	}
}

/**
 * Create the face on the left of the given half-edge, and returns it along with
 * the half-edges on its boundary.
 */
function createFace(
	start: HalfEdge, visited: Set<HalfEdge>
): [Face, HalfEdge[]] {
	const face: Face = {
		$horizontalHinge: false, $verticalHinge: false,
	};
	const edges: HalfEdge[] = [];
	let h = start;
	do {
		visited.add(h);
		edges.push(h);
		h.face = face;
		if(h.hinge && h.vector._y.$numerator == 0) face.$horizontalHinge = true;
		if(h.hinge && h.vector._x.$numerator == 0) face.$verticalHinge = true;
		if(h.left) face.$interior = h.left;
		h = h.next;
	} while(h != start);
	return [face, edges];
}

/**
 * Determine the directions and the phases of the axis-parallel creases in the
 * faces.
 *
 * In a face bounded by hinges, the creases are perpendicular to them, and the
 * phase is given by any of those hinges, which lies on a crease. A face
 * without hinges (which happens when the border of the sheet cuts it off from
 * its hinges) takes the direction and the phase reflected from a face adjacent
 * to it across a 45-degree ridge. A face with hinges in both directions gets
 * neither.
 */
export function resolveAxes(boundaries: ReadonlyMap<Face, HalfEdge[]>): void {
	const queue: Face[] = [];
	for(const [face, edges] of boundaries) {
		if(face.$interior || face.$horizontalHinge == face.$verticalHinge) {
			continue;
		}
		face.$axis = face.$verticalHinge ? "horizontal" : "vertical";
		face.$phase = getPhase(face.$axis, edges);
		queue.push(face);
	}
	for(let i = 0; i < queue.length; i++) {
		const face = queue[i];
		const reflected = face.$axis == "horizontal" ? "vertical" : "horizontal";
		for(const h of boundaries.get(face)!) {
			const c = h.ridge ? diagonalConstant(h) : undefined;
			if(c === undefined) continue;
			const other = h.twin.face;
			const hasHinge = other.$horizontalHinge || other.$verticalHinge;
			if(other.$axis || other.$interior || hasHinge) continue;
			other.$axis = reflected;
			// The crease at k meets the ridge at the point (k', k) (or (k, k')
			// for vertical creases), which continues as the crease at k', where
			// k + k' has the same parity as the constant of the ridge.
			if(face.$phase !== undefined) other.$phase = (face.$phase + c) % 2;
			queue.push(other);
		}
	}
}

/**
 * The phase of the face given by the hinges perpendicular to the creases, or
 * `undefined` if there is none or they are inconsistent (which should not
 * happen in a valid layout).
 */
function getPhase(axis: Axis, edges: readonly HalfEdge[]): number | undefined {
	let result: number | undefined;
	for(const h of edges) {
		if(!h.hinge || h.depth === undefined) continue;
		// The hinge is perpendicular to the creases, and lies on the crease
		// at its own coordinate.
		const k = axis == "horizontal" ?
			h.vector._x.$numerator == 0 && h.from.p._x :
			h.vector._y.$numerator == 0 && h.from.p._y;
		if(!k || !k.isIntegral) continue;
		const phase = parity(k.$value + h.depth);
		if(result === undefined) result = phase;
		else if(result != phase) return undefined;
	}
	return result;
}

/**
 * For a 45-degree line through the grid points, the parity of x + y on the
 * grid points of it (which equals that of x - y). Returns `undefined` if the
 * line is not 45-degree, or it doesn't pass through any grid points.
 */
function diagonalConstant(h: HalfEdge): number | undefined {
	const v = h.vector, p = h.from.p;
	let c: Fraction;
	if(v._x.eq(v._y)) c = p._x.sub(p._y);
	else if(v._x.eq(v._y.neg)) c = p._x.add(p._y);
	else return undefined;
	return c.isIntegral ? parity(c.$value) : undefined;
}

/** The parity of an integer, as 0 or 1. */
export function parity(n: number): number {
	return Math.abs(n) % 2;
}

interface HalfEdgeKind {
	readonly hinge: boolean;
	readonly ridge: boolean;
	readonly depth?: number;
	readonly left?: Interior;
}

function createHalfEdge(
	from: Vertex, to: Vertex, kind: HalfEdgeKind
): HalfEdge {
	const vector = to.p.$sub(from.p);
	// The rest of the fields are filled in later.
	return { from, to, vector, ...kind } as HalfEdge;
}

/**
 * The face of the sector at the vertex containing the given direction, which
 * is the face on the left of the last half-edge before the direction in the
 * counter-clockwise order.
 */
function sectorFace(vertex: Vertex, d: Vector): Face {
	const out = vertex.out;
	let result = out[out.length - 1];
	for(const h of out) {
		if(h.vector.$compareAngle(d) < 0) result = h;
		else break;
	}
	return result.face;
}

/**
 * The first point on the given half-edge hit by the vertical ray from the
 * given point towards the given side, or `null` if it misses.
 */
function verticalHit(h: HalfEdge, m: Point, f: Sign): Point | null {
	const a = h.from.p, b = h.to.p;
	const da = a._y.sub(m._y).f(f), db = b._y.sub(m._y).f(f);
	if(h.vector._x.$numerator == 0) {
		if(!a._x.eq(m._x)) return null;
		if(da.lt(Fraction.ZERO) && db.lt(Fraction.ZERO)) return null;
		if(da.lt(Fraction.ZERO) || db.lt(Fraction.ZERO)) return m;
		return da.lt(db) ? a : b;
	}
	const [left, right] = a._x.lt(b._x) ? [a, b] : [b, a];
	if(m._x.lt(left._x) || m._x.gt(right._x)) return null;
	const p = new Line(a, b).$xIntersection(m._x);
	return p._y.sub(m._y).f(f).lt(Fraction.ZERO) ? null : p;
}
