import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { DiffDoubleSet } from "shared/data/doubleMap/diffDoubleSet";

import type { Team } from "core/design/layout/team";
import type { Junction } from "core/design/layout/junction/junction";
import type { ITreeNode } from "core/design/context";
import type { Tree } from "core/design/context/tree";
import type { TreeNode } from "core/design/context/treeNode";

//=================================================================
/**
 * {@link State} 負責管理在更新的過程當中要被傳遞的各種資料。
 */
//=================================================================

export namespace State {

	/** 當前回合結束之後重設所有的暫時性狀態（持久狀態會被保留） */
	export function $reset(): void {
		$childrenChanged.clear();
		$parentChanged.clear();
		$lengthChanged.clear();
		$subtreeAABBChanged.clear();
		$flapAABBChanged.clear();
		$flapChanged.clear();
		$teams.clear();
		$rootChanged = false;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 持久狀態
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 當前的樹 */
	export let $tree: Tree;

	/** 所有的重疊組合 */
	export const $junctions = new IntDoubleMap<Junction>();

	/** 用來求出應該要被刪除掉的非法重疊 */
	export const $invalidJunctionDiff = new DiffDoubleSet();

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// 暫時狀態
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** 當前回合當中，子點曾經改變過（包括初始化）的點（隨後被刪除的點除外） */
	export const $childrenChanged = new Set<TreeNode>();

	/** 當前回合當中，父點曾經改變過（包括初始化）的點（最後的根點除外） */
	export const $parentChanged = new Set<ITreeNode>();

	/** 當前回合當中，根點有發生過改變 */
	export let $rootChanged: boolean;

	/** 當前回合當中，所有上連邊長曾經改變過的節點（已經列入 {@link $parentChanged} 者除外） */
	export const $lengthChanged = new Set<ITreeNode>();

	/** 當前回合當中，所有子樹的 {@link TreeNode.$AABB AABB} 曾經發生過改變的節點，用來判斷是否需要重新搜尋碰撞 */
	export const $subtreeAABBChanged = new Set<ITreeNode>();

	/** 當前回合當中，{@link TreeNode.$AABB AABB} 曾經改變的角片 */
	export const $flapAABBChanged = new Set<ITreeNode>();

	/** 當前回合當中有發生過任何改變的角片，等於 {@link $subtreeAABBChanged} 當中的角片 */
	export const $flapChanged = new Set<ITreeNode>();

	/** 當前回合當中分組出來的 {@link Team} */
	export const $teams = new Set<Team>();
}

State.$reset();
