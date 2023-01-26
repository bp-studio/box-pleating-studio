import { climb } from "./climb";
import { Task } from "./task";
import { State } from "core/service/state";

import type { TreeNode } from "../context/treeNode";

//=================================================================
/**
 * {@link heightTask} 負責更新 {@link TreeNode.$height}。
 */
//=================================================================
export const heightTask = new Task(process);

function process(): void {
	const init = State.$childrenChanged;
	climb(updater, init);
}

function updater(node: TreeNode): boolean {
	const newHeight = 1 + (node.$children.$get()?.$height ?? -1);
	if(newHeight === node.$height) return false;
	node.$height = newHeight;
	node.$parent?.$children.$notifyUpdate(node);
	return true;
}
