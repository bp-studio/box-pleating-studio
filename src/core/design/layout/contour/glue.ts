import { isClockwise } from "core/math/geometry/path";

import type { IRect } from "./carve";
import type { Path, PathEx } from "shared/types/geometry";

/** A directed edge, with the filled region on its left. */
interface Edge {
	readonly p: IPoint;
	readonly q: IPoint;
}

const EPSILON = 1e-9;

//=================================================================
/**
 * Glue the rectangles onto the region bounded by the paths, i.e. compute their
 * union, given that their interiors are disjoint, and they meet only along the
 * axis-aligned edges on the grid lines (or at single points). This is the case
 * for the orphan cells (see {@link regularize}), and is much faster than the
 * general polygon union.
 *
 * The coinciding edges with opposite directions cancel each other, and the
 * rest are chained into the resulting paths. Returns `null` if the input turns
 * out to violate the assumption (the edges coincide in the same direction).
 *
 * @param paths Non-overlapping paths with the filled regions on their left.
 * @param rects Rectangles with integer corners and disjoint interiors.
 */
//=================================================================
export function glue(
	paths: readonly Path[], rects: readonly IRect[]
): PathEx[] | null {
	const kept: Edge[] = [];
	// The axis-aligned edges on the grid lines, by the lines
	const lines = new Map<string, Edge[]>();
	const add = (p: IPoint, q: IPoint): void => {
		const key = gridLine(p, q);
		if(key === undefined) kept.push({ p, q });
		else getOrCreate(lines, key).push({ p, q });
	};
	for(const path of paths) {
		const l = path.length;
		for(let k = 0; k < l; k++) add(path[k], path[(k + 1) % l]);
	}
	for(const { x1, y1, x2, y2 } of rects) {
		const corners = [
			{ x: x1, y: y1 }, { x: x2, y: y1 },
			{ x: x2, y: y2 }, { x: x1, y: y2 },
		];
		const l = corners.length;
		for(let k = 0; k < l; k++) add(corners[k], corners[(k + 1) % l]);
	}
	for(const edges of lines.values()) {
		const remaining = cancel(edges);
		if(!remaining) return null;
		kept.push(...remaining);
	}
	return chain(kept);
}

function getOrCreate<K, V>(map: Map<K, V[]>, key: K): V[] {
	let result = map.get(key);
	if(!result) map.set(key, result = []);
	return result;
}

/** The key of the grid line containing the edge, if any. */
function gridLine(p: IPoint, q: IPoint): string | undefined {
	const onGrid = (v: number): boolean =>
		Math.abs(v - Math.round(v)) < EPSILON;
	if(p.x == q.x && onGrid(p.x)) return "x" + Math.round(p.x);
	if(p.y == q.y && onGrid(p.y)) return "y" + Math.round(p.y);
	return undefined;
}

/**
 * Split the collinear edges at all their endpoints, and cancel the pieces with
 * opposite directions. Returns `null` if two pieces have the same direction.
 */
function cancel(edges: readonly Edge[]): Edge[] | null {
	const vertical = edges[0].p.x == edges[0].q.x;
	const along = (p: IPoint): number => vertical ? p.y : p.x;
	const points = new Map<number, IPoint>();
	for(const { p, q } of edges) {
		points.set(along(p), p);
		points.set(along(q), q);
	}
	const sorted = [...points.keys()].sort((a, b) => a - b);
	const index = new Map(sorted.map((v, i) => [v, i]));

	// The net direction of each piece between consecutive points
	const net = new Array<number>(sorted.length).fill(0);
	const count = new Array<number>(sorted.length).fill(0);
	for(const { p, q } of edges) {
		const a = index.get(along(p))!, b = index.get(along(q))!;
		const sign = a < b ? 1 : -1;
		for(let i = Math.min(a, b); i < Math.max(a, b); i++) {
			net[i] += sign;
			count[i]++;
		}
	}
	const result: Edge[] = [];
	for(let i = 0; i + 1 < sorted.length; i++) {
		if(count[i] > 2 || Math.abs(net[i]) > 1) return null;
		if(net[i] == 0) continue;
		const a = points.get(sorted[i])!, b = points.get(sorted[i + 1])!;
		result.push(net[i] > 0 ? { p: a, q: b } : { p: b, q: a });
	}
	return result;
}

/**
 * Chain the edges into closed paths. At a vertex with several outgoing edges,
 * the one turning the most to the left is taken, so that the regions touching
 * at a single point are separated.
 */
function chain(edges: readonly Edge[]): PathEx[] | null {
	const key = (p: IPoint): string => p.x + "," + p.y;
	const outgoing = new Map<string, Edge[]>();
	for(const edge of edges) getOrCreate(outgoing, key(edge.p)).push(edge);
	const used = new Set<Edge>();
	const result: PathEx[] = [];
	for(const start of edges) {
		if(used.has(start)) continue;
		const path: PathEx = [];
		const end = key(start.p);
		let edge = start;
		for(;;) {
			used.add(edge);
			path.push(edge.p);
			if(key(edge.q) == end) break;
			const candidates = (outgoing.get(key(edge.q)) ?? [])
				.filter(e => !used.has(e));
			const next = leftmost(edge, candidates);
			// The path must be closed.
			if(!next) return null;
			edge = next;
		}
		path.isHole = isClockwise(path);
		result.push(path);
	}
	return result;
}

function leftmost(edge: Edge, candidates: readonly Edge[]): Edge | undefined {
	const dx = edge.q.x - edge.p.x, dy = edge.q.y - edge.p.y;
	let best: Edge | undefined, bestTurn = Number.NEGATIVE_INFINITY;
	for(const c of candidates) {
		const ex = c.q.x - c.p.x, ey = c.q.y - c.p.y;
		const turn = Math.atan2(dx * ey - dy * ex, dx * ex + dy * ey);
		if(turn > bestTurn) {
			best = c;
			bestTurn = turn;
		}
	}
	return best;
}
