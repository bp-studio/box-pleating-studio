import { State } from "core/service/state";
import { Task } from "./task";
import { distanceTask } from "./distance";

import type { heightTask } from "./height";
import type { TreeNode } from "../context/treeNode";
import type { Tree } from "../context/tree";

//=================================================================
/**
 * {@link balanceTask} updates {@link Tree.$root}.
 *
 * It depends on {@link heightTask} as it decides whether to re-balance
 * based on the height of each subtrees under the root.
 * Although it also modifies {@link TreeNode.$height} as it re-balances,
 * there's no real cyclic dependency here.
 *
 * {@link balanceTask.data} carries the "expected root id", used for history
 * navigation. If assigned, it will force the tree to re-balance to
 * that root. Without this mechanism, it could happen that the
 * choice of root changes after history navigation.
 */
//=================================================================
export const balanceTask = new Task<number>(balance, distanceTask);

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
	balanceTask.data = undefined;
}

function tryBalance(root: TreeNode): TreeNode | null {
	// Precondition check
	const first = root.$children.$get();
	if(!first) return null;
	const second = root.$children.$getSecond();
	const secondHeight = second ? second.$height + 1 : 0;
	if(first.$height <= secondHeight && first.id !== balanceTask.data) return null;

	// Balancing
	root.$height = secondHeight;
	first.$cut();
	root.$length = first.$length;
	root.$pasteTo(first);
	first.$length = 0;
	return first;
}
