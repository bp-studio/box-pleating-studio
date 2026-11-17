import { State } from "core/service/state";
import { formatEdges, formatFlaps } from "shared/utils/treeString";

import type { ITreeNode } from "../context";
import type { JEdge, JFlap, NodeId } from "shared/json";

/**
 * A layout in the format of `parseTree` in the tests (see
 * {@link formatEdges} and {@link formatFlaps}).
 */
export interface TreeString {
	edges: string;
	flaps: string;
}

/** The minimal tree as an undirected graph, mapping the edges to lengths. */
type Graph = Map<ITreeNode, Map<ITreeNode, number>>;

/**
 * Describe the layout of the given flaps by the minimal tree that keeps the
 * distances between them, so that the stretches without patterns can be
 * collected through Google Analytics and reproduced in the tests.
 *
 * The junctions depend only on the flap rectangles and the distances between
 * the flaps (see {@link createJunction}), so the same stretch is formed on the
 * minimal tree. The radii of the flaps could differ, but they don't affect the
 * pattern searching.
 *
 * To identify the same structures across designs, the result depends only on
 * the flap rectangles and the distances. The flaps are numbered from 1 in the
 * order of their positions and translated so that the minimal coordinates are
 * zero. The root (numbered 0) is the branching node next to flap 1, and the
 * other branching nodes are numbered in the order they are reached from the
 * flaps.
 */
export function getMinimalTree(leaves: readonly NodeId[]): TreeString {
	const nodes = State.m.$tree.$nodes;
	const flaps = leaves.map(id => {
		const node = nodes[id]!;
		const [top, right, bottom, left] = node.$AABB.$toValues();
		return {
			node, x: left, y: bottom, width: right - left, height: top - bottom,
		};
	});
	flaps.sort((a, b) =>
		a.x - b.x || a.y - b.y || a.width - b.width || a.height - b.height
	);
	const minX = flaps[0].x;
	const minY = Math.min(...flaps.map(f => f.y));

	const ids = new Map<ITreeNode, number>();
	const jFlaps: JFlap[] = flaps.map(({ node, x, y, width, height }, i) => {
		ids.set(node, i + 1);
		return {
			id: i + 1 as NodeId, x: x - minX, y: y - minY, width, height,
		};
	});
	return {
		edges: formatEdges(getEdges(getGraph(flaps.map(f => f.node)), ids)),
		flaps: formatFlaps(jFlaps),
	};
}

/**
 * The paths between the flaps, with the nodes of degree 2 contracted, so that
 * only the flaps and the branching nodes remain.
 */
function getGraph(flaps: readonly ITreeNode[]): Graph {
	// Count the flaps under each node, so that the LCA of the flaps is the
	// first node containing all of them.
	const counts = new Map<ITreeNode, number>();
	for(const flap of flaps) {
		for(let n: ITreeNode | undefined = flap; n; n = n.$parent) {
			counts.set(n, (counts.get(n) ?? 0) + 1);
		}
	}
	let lca = flaps[0];
	while(counts.get(lca) != flaps.length) lca = lca.$parent!;

	const graph: Graph = new Map();
	const connect = (a: ITreeNode, b: ITreeNode, length: number): void => {
		for(const [u, v] of [[a, b], [b, a]]) {
			const map = graph.get(u) ?? new Map<ITreeNode, number>();
			map.set(v, length);
			graph.set(u, map);
		}
	};
	for(const flap of flaps) {
		for(let n = flap; n != lca; n = n.$parent!) {
			// Stop at the paths already added.
			if(graph.get(n)?.has(n.$parent!)) break;
			connect(n, n.$parent!, n.$length);
		}
	}

	for(const [node, map] of [...graph]) {
		if(map.size != 2) continue;
		const [[a, x], [b, y]] = map;
		graph.delete(node);
		graph.get(a)!.delete(node);
		graph.get(b)!.delete(node);
		connect(a, b, x + y);
	}
	return graph;
}

/**
 * Orient the graph from the root, which is the branching node next to flap 1,
 * or a virtual one in the middle if there are only two flaps.
 * @param ids The ids of the flaps, to which the branching nodes are added.
 */
function getEdges(graph: Graph, ids: Map<ITreeNode, number>): JEdge[] {
	const edge = (n1: number, n2: number, length: number): JEdge =>
		({ n1: n1 as NodeId, n2: n2 as NodeId, length });
	const [first] = [...ids].find(([, id]) => id == 1)!;
	const [[root, d]] = graph.get(first)!;
	if(ids.has(root)) {
		// There must be an internal node for the tree to have two leaves.
		const half = Math.ceil(d / 2);
		return [edge(0, 1, half), edge(0, 2, d - half)];
	}

	const parents = new Map<ITreeNode, ITreeNode>();
	const queue = [root];
	for(const node of queue) {
		for(const neighbor of graph.get(node)!.keys()) {
			if(neighbor == root || parents.has(neighbor)) continue;
			parents.set(neighbor, node);
			queue.push(neighbor);
		}
	}

	ids.set(root, 0);
	const flaps = [...ids.keys()].filter(n => n != root);
	const result: JEdge[] = [];
	for(const flap of flaps) {
		for(let n = flap; n != root;) {
			const parent = parents.get(n)!;
			const isNew = !ids.has(parent);
			if(isNew) ids.set(parent, ids.size);
			const length = graph.get(n)!.get(parent)!;
			result.push(edge(ids.get(parent)!, ids.get(n)!, length));
			if(!isNew) break;
			n = parent;
		}
	}
	return result;
}
