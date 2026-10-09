import { shallowRef } from "vue";

import { getOrderedKey } from "shared/data/doubleMap/intDoubleMap";

import type { NodeId, ProjId } from "shared/json";
import type { Tree } from "./tree";
import type { Grid } from "../grid/grid";

/** A node in a {@link Subtree}. */
export interface SubtreeNode {
	/**
	 * The index of the parent node in the {@link Subtree},
	 * or -1 if the parent is the pasting target.
	 */
	readonly parent: number;

	/** The length of the edge to the parent. */
	readonly length: number;

	readonly name: string;

	/**
	 * The location of the node relative to the parent of the whole subtree
	 * (i.e. the vertex above it, which is not included).
	 */
	readonly offset: IPoint;

	/** The dimension of the flap, if the node is a leaf. */
	readonly flap?: IDimension;
}

/**
 * A copied subtree, including the edge above its root.
 * The nodes are ordered so that each parent comes before its children.
 */
export type Subtree = readonly SubtreeNode[];

/**
 * The content of the clipboard. It is shared by all projects,
 * so that subtrees can be copied from one project to another.
 * Use {@link setClipboard} to modify it.
 */
export const clipboard = shallowRef<readonly Subtree[]>([]);

/** Notifies the other instances of the new content of the clipboard. */
interface SetMessage {
	readonly type: "set";
	readonly time: number;
	readonly data: readonly Subtree[];
}

/** Asks the other instances for the content of their clipboard. */
interface QueryMessage {
	readonly type: "query";
}

type ClipboardMessage = SetMessage | QueryMessage;

/** The time when the content of the {@link clipboard} was set. */
let clipboardTime = 0;

/**
 * The project in which the content of the {@link clipboard} was set, or
 * `undefined` if it was set in another instance of the app.
 */
let clipboardSource: ProjId | undefined;

/**
 * The channel for syncing the {@link clipboard} across instances of the app.
 * It is not available in older browsers, in which case the clipboard simply
 * works within the current instance.
 */
const channel = typeof BroadcastChannel == "function" ?
	// eslint-disable-next-line compat/compat
	new BroadcastChannel("bp-studio-clipboard") : undefined;

if(channel) {
	channel.onmessage = (e: MessageEvent<ClipboardMessage>) => {
		const msg = e.data;
		if(msg.type == "query") {
			if(clipboard.value.length) post();
		} else if(msg.time > clipboardTime) {
			clipboardTime = msg.time;
			clipboardSource = undefined;
			clipboard.value = msg.data;
		}
	};
	// Get the content from the other instances that are already opened.
	channel.postMessage({ type: "query" } satisfies ClipboardMessage);
}

/** @param source The project in which the content is set. */
export function setClipboard(
	subtrees: readonly Subtree[], source: ProjId
): void {
	clipboardTime = Date.now();
	clipboardSource = source;
	clipboard.value = subtrees;
	post();
}

/**
 * Where the content of the {@link clipboard} comes from, relative to the given
 * project (for analytics).
 */
export function getClipboardSource(target: ProjId): string {
	if(clipboardSource === undefined) return "window";
	return clipboardSource == target ? "project" : "other_project";
}

function post(): void {
	const data = clipboard.value;
	channel?.postMessage(
		{ type: "set", time: clipboardTime, data } satisfies ClipboardMessage
	);
}

/** The range of the final adjustment of the pasted subtrees. */
const PASTE_ADJUST_RANGE = 2;

/**
 * The locations of the nodes of a pasted {@link Subtree}, restored relative to
 * the vertex it is pasted under. They are first brought onto the sheet (see
 * {@link Grid.$fitPoints}), and then shifted together within a small range to
 * overlap the fewest occupied spots (given by {@link getOrderedKey}), staying
 * on the sheet.
 */
export function placeSubtree(
	grid: Grid, base: IPoint, subtree: Subtree, occupied: ReadonlySet<number>
): IPoint[] {
	const points = grid.$fitPoints(subtree.map(
		({ offset }) => ({ x: base.x + offset.x, y: base.y + offset.y })
	));
	let result = points;
	let minOverlap = Number.POSITIVE_INFINITY;
	let minDist = Number.POSITIVE_INFINITY;
	const r = PASTE_ADJUST_RANGE;
	for(let dx = -r; dx <= r; dx++) {
		for(let dy = -r; dy <= r; dy++) {
			const moved = points.map(p => ({ x: p.x + dx, y: p.y + dy }));
			if(!moved.every(p => grid.$contains(p))) continue;
			const overlap = moved
				.filter(p => occupied.has(getOrderedKey(p.x, p.y))).length;
			const d = dx * dx + dy * dy;
			if(overlap < minOverlap || overlap == minOverlap && d < minDist) {
				result = moved;
				minOverlap = overlap;
				minDist = d;
			}
		}
	}
	return result;
}

export interface CollectResult {
	readonly subtrees: Subtree[];

	/** The ids of the nodes included in the {@link subtrees}. */
	readonly ids: NodeId[];
}

/**
 * Group the given nodes into connected components, and collect those
 * components that are connected to the rest of the tree by exactly one edge.
 * The other components are ignored, as there's no way to tell which edge is
 * the one above the subtree. Note that this doesn't depend on the root of the
 * tree, which is not known to the user.
 */
export function collectSubtrees(
	tree: Tree, ids: ReadonlySet<NodeId>
): CollectResult {
	const result: CollectResult = { subtrees: [], ids: [] };
	const visited = new Set<NodeId>();
	for(const id of ids) {
		if(visited.has(id)) continue;
		const component = getComponent(tree, ids, id);
		for(const n of component) visited.add(n);
		const outerEdges = component.flatMap(n =>
			[...neighbors(tree, n)]
				.filter(m => !ids.has(m))
				.map(m => [n, m] as const)
		);
		if(outerEdges.length !== 1) continue;
		const [root, parent] = outerEdges[0];
		result.subtrees.push(createSubtree(tree, root, parent));
		result.ids.push(...component);
	}
	return result;
}

function neighbors(tree: Tree, id: NodeId): Iterable<NodeId> {
	return tree.$edges.get(id)!.keys();
}

function getComponent(
	tree: Tree, ids: ReadonlySet<NodeId>, start: NodeId
): NodeId[] {
	const result = [start];
	const visited = new Set(result);
	for(let i = 0; i < result.length; i++) {
		for(const n of neighbors(tree, result[i])) {
			if(!ids.has(n) || visited.has(n)) continue;
			visited.add(n);
			result.push(n);
		}
	}
	return result;
}

/** Create the {@link Subtree} hanging from the given parent. */
function createSubtree(tree: Tree, root: NodeId, parent: NodeId): Subtree {
	const flaps = tree.$project.design.layout.$flaps;
	const base = tree.$vertices.$get(parent)!.$location;
	const result: SubtreeNode[] = [];
	const queue: [id: NodeId, from: NodeId, index: number][] = [
		[root, parent, -1],
	];
	for(const [id, from, index] of queue) {
		const vertex = tree.$vertices.$get(id)!;
		const flap = vertex.isLeaf ? flaps.get(id)?.toJSON() : undefined;
		const { x, y } = vertex.$location;
		result.push({
			parent: index,
			length: tree.$edges.get(id, from)!.length,
			name: vertex.name,
			offset: { x: x - base.x, y: y - base.y },
			flap: flap && { width: flap.width, height: flap.height },
		});
		const current = result.length - 1;
		for(const n of neighbors(tree, id)) {
			if(n !== from) queue.push([n, id, current]);
		}
	}
	return result;
}
