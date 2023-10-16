import { climb } from "./utils/climb";
import { Task } from "./task";
import { State } from "core/service/state";
import { balanceTask } from "./balance";

import type { ITreeNode } from "../context";
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

function updater(node: ITreeNode): boolean {
	const n = node as TreeNode;
	const newHeight = 1 + (n.$children.$get()?.$height ?? -1);
	if(newHeight === n.$height) return false;
	n.$height = newHeight;
	n.$parent?.$children.$notifyUpdate(n);
	return true;
}
