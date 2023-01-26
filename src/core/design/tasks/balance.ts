import { State } from "core/service/state";
import { heightTask } from "./height";
import { Task } from "./task";

import type { TreeNode } from "../context/treeNode";
import type { Tree } from "../context/tree";

//=================================================================
/**
 * {@link balanceTask} 負責更新 {@link Tree.$root}。
 */
//=================================================================
export const balanceTask = new Task(process, heightTask);

function process(): void {
	const tree = State.$tree;
	const oldRoot = tree.$root;
	let newRoot = balance(oldRoot);
	while(newRoot) {
		State.$parentChanged.add(tree.$root);
		tree.$root = newRoot;
		newRoot = balance(tree.$root);
	}
	if(tree.$root != oldRoot) State.$rootChanged = true;
}

function balance(root: TreeNode): TreeNode | null {
	// 前置條件檢查
	const first = root.$children.$get();
	if(!first) return null;
	const second = root.$children.$getSecond();
	const height = second ? second.$height + 1 : 0;
	if(first.$height <= height) return null;

	// 進行平衡
	root.$height = height;
	first.$cut();
	root.$length = first.$length;
	root.$pasteTo(first);
	first.$length = 0;
	return first;
}
