import { Task } from "./task";
import { State } from "core/service/state";
import { createJunction, Junction } from "../layout/junction/junction";
import { invalidJunctionTask } from "./invalidJunction";
import { stretchTask } from "./stretch";
import { dist } from "../context/tree";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link junctionTask} maintains {@link State.$junctions}.
 *
 * The major breakthrough of this new algorithm is that there's no
 * need to maintain LCA for the entire tree anymore, as LCA will
 * be provided automatically during the course of the algorithm.
 */
//=================================================================
export const junctionTask = new Task(junction, invalidJunctionTask, stretchTask);

function junction(): void {
	// Delete junctions related to deleted nodes or nodes that are no longer leaves
	for(const id of State.$updateResult.remove.nodes) {
		State.$junctions.delete(id);
	}
	for(const node of State.$childrenChanged) {
		if(node.$children.$size > 0) State.$junctions.delete(node.id);
	}

	// Find all overlapping
	getCollisionOfLCA(State.$tree.$root);
}

function getCollisionOfLCA(lca: ITreeNode): void {
	const children = [...lca.$children];
	const l = children.length;
	for(let i = 0; i < l; i++) {
		const a = children[i];
		for(let j = i + 1; j < l; j++) compare(a, children[j], lca);
		if(State.$subtreeAABBChanged.has(a)) {
			getCollisionOfLCA(getNontrivialDescendant(a));
		}
	}
}

function compare(a: ITreeNode, b: ITreeNode, lca: ITreeNode): void {
	const d = dist(a, b, lca);
	const distChanged = State.$distCache.get(a.id, b.id) !== d;
	// If both subtrees haven't changed, there's no need to re-compare.
	if(!distChanged && !State.$subtreeAABBChanged.has(a) && !State.$subtreeAABBChanged.has(b)) return;
	if(distChanged) State.$distCache.set(a.id, b.id, d);

	// Test for collision
	if(!a.$AABB.$intersects(b.$AABB, d)) {
		clearJunctions(a, b);
		return;
	}

	a = getNontrivialDescendant(a);
	b = getNontrivialDescendant(b);
	const n = a.$children.$size;
	const m = b.$children.$size;
	if(n === 0 && m === 0) {
		// Leaves found; add it to the output
		State.$junctions.set(a.id, b.id, createJunction(a, b, lca));
	} else {
		// Choose the one with fewer children, to minimize comparisons.
		if(m === 0 || n !== 0 && n < m) {
			for(const c of a.$children) compare(c, b, lca);
		} else {
			for(const c of b.$children) compare(a, c, lca);
		}
	}
}

function getNontrivialDescendant(node: ITreeNode): ITreeNode {
	while(node.$children.$size === 1) {
		node = node.$children.$get()!;
	}
	return node;
}

/**
 * Clear all {@link Junction} between leaves under the two given nodes.
 */
function clearJunctions(a: ITreeNode, b: ITreeNode): void {
	// TODO: Improve this part
	for(const aLeaf of a.$getLeaves()) {
		for(const bLeaf of b.$getLeaves()) {
			State.$junctions.delete(aLeaf.id, bLeaf.id);
		}
	}
}
