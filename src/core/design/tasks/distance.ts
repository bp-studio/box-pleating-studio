import { State } from "core/service/state";
import { Task } from "./task";
import { AABBTask } from "./aabb";
import { HeapSet } from "shared/data/heap/heapSet";

import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link distanceTask} 負責在樹有重新平衡發生的時候更新 {@link TreeNode.$dist}。
 */
//=================================================================
export const distanceTask = new Task(process, AABBTask);

function process(): void {
	if(State.$rootChanged) {
		// 樹根有變化的情況就完整全部更新
		updateDistRecursive(State.$tree.$root, 0);
	} else {
		// 否則只更新那些邊長有變動的節點以及其子樹即可
		const heap = new HeapSet<TreeNode>((a, b) => a.$dist - b.$dist);
		for(const node of State.$lengthChanged) heap.$insert(node as TreeNode);
		while(!heap.$isEmpty) {
			const node = heap.$pop()!;
			node.$dist = node.$parent!.$dist + node.$length;
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
