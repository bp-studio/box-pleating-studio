import { State } from "core/service/state";
import { Task } from "./task";
import { AABBTask } from "./aabb";
import { HeapSet } from "shared/data/heap/heapSet";
import { maxDistComparator } from "../context/treeNode";
import { climb } from "./utils/climb";

import type { ITreeNode } from "../context";
import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link structureTask} updates {@link TreeNode.$dist} and {@link TreeNode.$leaves} after the tree re-balances.
 */
//=================================================================
export const structureTask = new Task(structure, AABBTask);

function structure(): void {
	if(State.$rootChanged) {
		// Perform a full update if the root changed.
		updateDistRecursive(State.$tree.$root, 0);
	} else {
		// Otherwise it suffices to update the subtrees
		// under nodes with the lengths of their parent edges changed.
		const heap = new HeapSet<ITreeNode>(maxDistComparator);
		for(const node of State.$lengthChanged) heap.$insert(node);
		while(!heap.$isEmpty) {
			const node = heap.$pop()!;
			(<TreeNode>node).$dist = node.$parent!.$dist + node.$length;
			for(const child of node.$children) heap.$insert(child);
		}
	}

	// Updating leaf lists. This depends on the distance info.
	climb(leafList, State.$childrenChanged);
}

function updateDistRecursive(node: TreeNode, v: number): void {
	node.$dist = v;
	for(const child of node.$children) {
		updateDistRecursive(child, v + child.$length);
	}
}

function leafList(node: ITreeNode): boolean {
	(node as TreeNode).$updateLeaves();
	return true;
}
