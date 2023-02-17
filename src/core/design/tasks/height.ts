import { climb } from "./climb";
import { Task } from "./task";
import { State } from "core/service/state";
import { balanceTask } from "./balance";

import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link heightTask} updates {@link TreeNode.$height}.
 *
 * This task is the foremost task of all.
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
