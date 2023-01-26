import { State } from "core/service/state";
import { balanceTask } from "./balance";
import { Task } from "./task";

import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link distanceTask} 負責更新 {@link TreeNode.$dist}。
 */
//=================================================================
export const distanceTask = new Task(process, balanceTask);

function process(): void {
	if(State.$rootChanged) updateDistRecursive(State.$tree.$root, 0);
}

function updateDistRecursive(node: TreeNode, v: number): void {
	node.$dist = v;
	for(const child of node.$children) {
		updateDistRecursive(child, v + child.$length);
	}
}
