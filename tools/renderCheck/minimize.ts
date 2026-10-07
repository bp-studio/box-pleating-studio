import { build, cloneLayout, isCheckable } from "./layouts";
import { checkRendering } from "./checks";

import type { Issue } from "./checks";
import type { Edge, Layout } from "./layouts";

/**
 * Check a layout, returning the issues found (a crash is also an issue), or
 * null if the layout is not checkable.
 */
export function inspect(layout: Layout): Issue[] | null {
	try {
		build(layout);
	} catch(e) {
		const message = e instanceof Error ? e.message : String(e);
		return [{ kind: "crash", message, points: [] }];
	}
	if(!isCheckable()) return null;
	try {
		return checkRendering();
	} catch(e) {
		const message = e instanceof Error ? e.message : String(e);
		return [{ kind: "crash", message, points: [] }];
	}
}

/**
 * Shrink a failing layout into a minimal one with an issue of the same kind,
 * by removing flaps, shortening edges and shrinking flaps one at a time, as
 * long as the layout stays checkable.
 */
export function minimize(layout: Layout, kind: Issue["kind"]): Layout {
	const fails = (l: Layout): boolean =>
		Boolean(inspect(l)?.some(issue => issue.kind == kind));
	let current = cloneLayout(layout);
	let progress = true;
	while(progress) {
		progress = false;
		for(const candidate of shrink(current)) {
			if(fails(candidate)) {
				current = candidate;
				progress = true;
				break;
			}
		}
	}
	return current;
}

/** All the layouts one step smaller than the given one. */
function* shrink(layout: Layout): Generator<Layout> {
	for(const flap of layout.flaps) {
		const removed = removeLeaf(layout, flap.id);
		if(removed) yield removed;
	}
	for(let i = 0; i < layout.edges.length; i++) {
		if(layout.edges[i].length <= 1) continue;
		const result = cloneLayout(layout);
		result.edges[i].length--;
		yield result;
	}
	for(let i = 0; i < layout.flaps.length; i++) {
		for(const key of ["width", "height"] as const) {
			if(layout.flaps[i][key] == 0) continue;
			const result = cloneLayout(layout);
			result.flaps[i][key]--;
			yield result;
		}
	}
}

const MIN_FLAPS = 2;

/**
 * Remove a flap, as well as the internal nodes that become leaves. The edges
 * are regarded as undirected, since the root could also be a flap.
 */
function removeLeaf(layout: Layout, id: number): Layout | null {
	const flaps = layout.flaps.filter(f => f.id != id);
	if(flaps.length < MIN_FLAPS) return null;
	const flapIds = new Set(flaps.map(f => f.id));
	let edges = layout.edges.filter(e => e.n1 != id && e.n2 != id);
	let dangling = findDanglingNode(edges, flapIds);
	while(dangling !== undefined) {
		const node = dangling;
		edges = edges.filter(e => e.n1 != node && e.n2 != node);
		dangling = findDanglingNode(edges, flapIds);
	}
	return cloneLayout({ edges, flaps });
}

/** A node other than the flaps with only one edge, if any. */
function findDanglingNode(
	edges: readonly Edge[], flapIds: ReadonlySet<number>
): number | undefined {
	const degree = new Map<number, number>();
	for(const { n1, n2 } of edges) {
		degree.set(n1, (degree.get(n1) ?? 0) + 1);
		degree.set(n2, (degree.get(n2) ?? 0) + 1);
	}
	for(const [node, d] of degree) {
		if(d == 1 && !flapIds.has(node)) return node;
	}
	return undefined;
}
