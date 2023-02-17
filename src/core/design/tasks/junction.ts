import { Task } from "./task";
import { State } from "core/service/state";
import { createJunction, Junction } from "../layout/junction/junction";
import { invalidJunctionTask } from "./invalidJunction";
import { getKey, getPair } from "shared/data/doubleMap/intDoubleMap";
import { stretchTask } from "./stretch";
import { dist } from "../context/tree";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link junctionTask} maintains {@link State.$junctions}。
 *
 * The major breakthrough of this new algorithm is that there's no
 * need to maintain LCA for the entire tree anymore, as LCA will
 * be provided automatically during the course of the algorithm.
 */
//=================================================================
export const junctionTask = new Task(junction, invalidJunctionTask, stretchTask);

/** The keys of those {@link Junction}s that should be deleted in the current round. */
const pendingDelete = new Set<number>();

function junction(): void {
	if(State.$junctions.size > 0) {
		// If one of the flaps changes, list it as pending delete.
		for(const flap of State.$flapChanged) {
			for(const id of State.$junctions.get(flap.id)!.keys()) {
				pendingDelete.add(getKey(id, flap.id));
			}
		}
	}

	// Find all overlapping
	getCollisionOfLCA(State.$tree.$root);

	// Delete the pending junctions
	for(const key of pendingDelete) {
		State.$junctions.delete(...getPair(key));
	}
	pendingDelete.clear();
}

function getNontrivialDescendant(node: ITreeNode): ITreeNode {
	while(node.$children.$size === 1) {
		node = node.$children.$get()!;
	}
	return node;
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
	// If both subtrees haven't changed, there's no need to re-compare.
	if(!State.$subtreeAABBChanged.has(a) && !State.$subtreeAABBChanged.has(b)) return;

	// Test for collision
	if(!a.$AABB.$intersects(b.$AABB, dist(a, b, lca))) return;

	a = getNontrivialDescendant(a);
	b = getNontrivialDescendant(b);
	const n = a.$children.$size;
	const m = b.$children.$size;
	if(n === 0 && m === 0) {
		// Leaves found; add it to the output
		State.$junctions.set(a.id, b.id, createJunction(a, b, lca));

		// Cancel the pending delete
		pendingDelete.delete(getKey(a.id, b.id));
	} else {
		// Choose the one with fewer children, to minimize comparisons.
		if(m === 0 || n !== 0 && n < m) {
			for(const c of a.$children) compare(c, b, lca);
		} else {
			for(const c of b.$children) compare(a, c, lca);
		}
	}
}
