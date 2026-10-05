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
