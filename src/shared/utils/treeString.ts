import type { JEdge, JFlap, NodeId } from "shared/json";

// The string format of trees, as used in the test cases (see
// Design.createTestCase).

/** Parse a comma-separated list of tuples of integers, like `(1,2),(3,4)`. */
function parseTuples(s: string): number[][] {
	return (s.match(/\([-\d,]+\)/g) ?? [])
		.map(m => m.slice(1, -1).split(",").map(Number));
}

/** Parse a comma-separated list of `(n1,n2,length)`. */
export function parseEdges(s: string): JEdge[] {
	return parseTuples(s).map(([n1, n2, length]) => ({
		n1: n1 as NodeId,
		n2: n2 as NodeId,
		length,
	}));
}

/** Parse a comma-separated list of `(id,x,y,width,height)`. */
export function parseFlaps(s: string): JFlap[] {
	return parseTuples(s).map(([id, x, y, width, height]) => ({
		id: id as NodeId,
		x, y, width, height,
	}));
}

/** Inverse of {@link parseEdges}. */
export function formatEdges(edges: readonly JEdge[]): string {
	return edges.map(e => `(${e.n1},${e.n2},${e.length})`).join(",");
}

/** Inverse of {@link parseFlaps}. */
export function formatFlaps(flaps: readonly JFlap[]): string {
	return flaps
		.map(f => `(${f.id},${f.x},${f.y},${f.width},${f.height})`)
		.join(",");
}
