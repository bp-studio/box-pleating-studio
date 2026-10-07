import type { Line } from "./line";
import type { Point } from "./point";

/** An item to be subdivided, carrying a {@link Line} segment. */
export interface WithLine {
	readonly line: Line;
}

/** An item covering a {@link SubdividedEdge}. */
export interface EdgeSource<T extends WithLine> {
	readonly item: T;
	/** Whether the segment of the item goes from p1 to p2 of the edge. */
	readonly forward: boolean;
}

/** A piece of the subdivided segments. */
export interface SubdividedEdge<T extends WithLine> {
	readonly p1: Point;
	readonly p2: Point;

	/** The items whose segments cover this piece. */
	readonly sources: EdgeSource<T>[];
}

interface SplitLine<T extends WithLine> {
	readonly item: T;
	readonly points: Point[];
}

/**
 * Split the segments at all their intersections (including the T-junctions),
 * and merge the overlapping parts, so that the resulting edges meet only at
 * their endpoints. All computations are exact. Degenerated segments are
 * ignored.
 *
 * This is a simple quadratic algorithm (with a quick rejection by the bounding
 * boxes), which is intended for one-time operations such as generating CP.
 */
export function subdivide<T extends WithLine>(
	items: readonly T[]
): SubdividedEdge<T>[] {
	const lines: SplitLine<T>[] = items
		.filter(item => !item.line.$isDegenerated)
		.map(item => ({ item, points: [item.line.p1, item.line.p2] }));
	const bounds = lines.map(l => getBounds(l.item.line));
	for(let i = 0; i < lines.length; i++) {
		for(let j = i + 1; j < lines.length; j++) {
			if(!overlaps(bounds[i], bounds[j])) continue;
			intersect(lines[i], lines[j]);
		}
	}

	const edges = new Map<string, SubdividedEdge<T>>();
	for(const { item, points } of lines) {
		const { p1, p2 } = item.line;
		const v = p2.$sub(p1);
		const sorted = points
			.map(p => ({ p, t: p.$sub(p1).$exactDot(v) }))
			.sort((a, b) => a.t.$compare(b.t))
			.map(e => e.p)
			.filter((p, i, arr) => i == 0 || !p.eq(arr[i - 1]));
		for(let k = 0; k < sorted.length - 1; k++) {
			addEdge(edges, sorted[k], sorted[k + 1], item);
		}
	}
	return [...edges.values()];
}

/** Add the piece of the segment of the item going from p to q. */
function addEdge<T extends WithLine>(
	edges: Map<string, SubdividedEdge<T>>, p: Point, q: Point, item: T
): void {
	const kp = p.toString(), kq = q.toString();
	const forward = kp < kq;
	const key = forward ? kp + "|" + kq : kq + "|" + kp;
	let edge = edges.get(key);
	if(!edge) {
		const [p1, p2] = forward ? [p, q] : [q, p];
		edges.set(key, edge = { p1, p2, sources: [] });
	}
	edge.sources.push({ item, forward });
}

/**
 * Record the intersections of the two segments, including the endpoints of
 * the overlapping parts if they are collinear.
 */
function intersect<T extends WithLine>(
	a: SplitLine<T>, b: SplitLine<T>
): void {
	const la = a.item.line, lb = b.item.line;
	const p = la.$intersectLine(lb);
	if(p) {
		a.points.push(p);
		b.points.push(p);
		return;
	}
	if(!la.$vector.$parallel(lb.$vector) || !la.$lineContains(lb.p1)) return;
	for(const q of [lb.p1, lb.p2]) if(la.$contains(q)) a.points.push(q);
	for(const q of [la.p1, la.p2]) if(lb.$contains(q)) b.points.push(q);
}

type Bounds = [number, number, number, number];

/**
 * The bounding box of the line, for quickly ruling out the pairs that don't
 * intersect. We use floating numbers here, with a margin for safety.
 */
function getBounds(l: Line): Bounds {
	const { p1, p2 } = l;
	return [
		Math.min(p1.x, p2.x) - MARGIN, Math.min(p1.y, p2.y) - MARGIN,
		Math.max(p1.x, p2.x) + MARGIN, Math.max(p1.y, p2.y) + MARGIN,
	];
}

const MARGIN = 0.5;

function overlaps(a: Bounds, b: Bounds): boolean {
	return a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];
}
