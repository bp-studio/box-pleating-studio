import { State } from "core/service/state";
import { Task } from "./task";
import { distanceTask } from "./distance";

import type { heightTask } from "./height";
import type { TreeNode } from "../context/treeNode";
import type { Tree } from "../context/tree";

//=================================================================
/**
 * {@link balanceTask} 負責更新 {@link Tree.$root}。
 *
 * 它的依賴為 {@link heightTask}，
 * 因為它是根據根點底下的各個子點之高度來決定是否需要進行平衡。
 * 雖然它在平衡的過程當中也會動到 {@link TreeNode.$height}，
 * 但是這邊並不會出現實際上的循環相依。
 */
//=================================================================
export const balanceTask = new Task(balance, distanceTask);

function balance(): void {
	const tree = State.$tree;
	const oldRoot = tree.$root;
	let newRoot = tryBalance(oldRoot);
	while(newRoot) {
		State.$parentChanged.add(tree.$root);
		tree.$root = newRoot;
		newRoot = tryBalance(tree.$root);
	}
	if(tree.$root != oldRoot) State.$rootChanged = true;
}

function tryBalance(root: TreeNode): TreeNode | null {
	// 前置條件檢查
	const first = root.$children.$get();
	if(!first) return null;
	const second = root.$children.$getSecond();
	const height = second ? second.$height + 1 : 0;
	if(first.$height <= height) return null;

	// 進行平衡
	root.$height = height;
	first.$cut(true);
	root.$length = first.$length;
	root.$pasteTo(first, true);
	first.$length = 0;
	return first;
}
