import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";

import type { ITreeNode } from "core/design/context";
import type { Tree } from "core/design/context/tree";
import type { TreeNode } from "core/design/context/treeNode";

//=================================================================
/**
 * {@link State} 負責管理在更新的過程當中要被傳遞的各種資料。
 */
//=================================================================

export namespace State {

	/** 當前的樹 */
	export let $tree: Tree;

	/** 所有的重疊組合、以及對應的兩點之間的樹狀距離 */
	export const $collisions = new IntDoubleMap<number>();

	/** 當前回合當中，子點曾經改變過（包括初始化）的點 */
	export const $childrenChanged = new Set<TreeNode>();

	/** 當前回合當中，父點曾經改變過（包括初始化）的點 */
	export const $parentChanged = new Set<ITreeNode>();

	/** 當前回合中根點有發生改變 */
	export let $rootChanged: boolean;

	/** 當前回合當中，所有上連邊長曾經改變過的節點 */
	export const $lengthChanged = new Set<ITreeNode>();

	/** 當前回合當中，所有 {@link TreeNode.$AABB AABB} 曾經發生過改變的節點 */
	export const $AABBChanged = new Set<ITreeNode>();

	export function $reset(): void {
		$childrenChanged.clear();
		$parentChanged.clear();
		$lengthChanged.clear();
		$AABBChanged.clear();
		$rootChanged = false;
	}

	$reset();
}
