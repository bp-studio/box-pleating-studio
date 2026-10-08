import { shallowRef } from "vue";

import type { NodeId } from "shared/json";
import type { Tree } from "./tree";

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
			clipboard.value = msg.data;
		}
	};
	// Get the content from the other instances that are already opened.
	channel.postMessage({ type: "query" } satisfies ClipboardMessage);
}

export function setClipboard(subtrees: readonly Subtree[]): void {
	clipboardTime = Date.now();
	clipboard.value = subtrees;
	post();
}

function post(): void {
	const data = clipboard.value;
	channel?.postMessage(
		{ type: "set", time: clipboardTime, data } satisfies ClipboardMessage
	);
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
	const result: SubtreeNode[] = [];
	const queue: [id: NodeId, from: NodeId, index: number][] = [
		[root, parent, -1],
	];
	for(const [id, from, index] of queue) {
		const vertex = tree.$vertices.$get(id)!;
		const flap = vertex.isLeaf ? flaps.get(id)?.toJSON() : undefined;
		result.push({
			parent: index,
			length: tree.$edges.get(id, from)!.length,
			name: vertex.name,
			flap: flap && { width: flap.width, height: flap.height },
		});
		const current = result.length - 1;
		for(const n of neighbors(tree, id)) {
			if(n !== from) queue.push([n, id, current]);
		}
	}
	return result;
}
