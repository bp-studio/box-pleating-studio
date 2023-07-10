import { State } from "core/service/state";
import { Task } from "./task";
import { AABBTask } from "./aabb";
import { HeapSet } from "shared/data/heap/heapSet";
import { comparator } from "../context/treeNode";

import type { ITreeNode } from "../context";
import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link distanceTask} updates {@link TreeNode.$dist} after the tree re-balances.
 */
//=================================================================
export const distanceTask = new Task(distance, AABBTask);

function distance(): void {
	if(State.$rootChanged) {
		// Perform a full update if the root changed.
		updateDistRecursive(State.$tree.$root, 0);
	} else {
		// Otherwise it suffices to update the subtrees
		// under nodes with the lengths of their parent edges changed.
		const heap = new HeapSet<ITreeNode>(comparator);
		for(const node of State.$lengthChanged) heap.$insert(node);
		while(!heap.$isEmpty) {
			const node = heap.$pop()!;
			(<TreeNode>node).$dist = node.$parent!.$dist + node.$length;
			for(const child of node.$children) heap.$insert(child);
		}
	}
}

function updateDistRecursive(node: TreeNode, v: number): void {
	node.$dist = v;
	for(const child of node.$children) {
		updateDistRecursive(child, v + child.$length);
	}
}
