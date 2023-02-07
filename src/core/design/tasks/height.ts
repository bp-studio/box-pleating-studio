import { climb } from "./climb";
import { Task } from "./task";
import { State } from "core/service/state";
import { balanceTask } from "./balance";

import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link heightTask} 負責更新 {@link TreeNode.$height}。
 *
 * 這個工作是所有更新工作的最起點。
 */
//=================================================================
export const heightTask = new Task(height, balanceTask);

function height(): void {
	climb(updater, State.$childrenChanged);
}

function updater(node: TreeNode): boolean {
	const newHeight = 1 + (node.$children.$get()?.$height ?? -1);
	if(newHeight === node.$height) return false;
	node.$height = newHeight;
	node.$parent?.$children.$notifyUpdate(node);
	return true;
}
