import { Task } from "./task";
import { State } from "core/service/state";
import { Overlap } from "../layout/overlap";
import { junctionTask } from "./junction";
import { getKey, getPair } from "shared/data/doubleMap/intDoubleMap";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link overlapTask} 負責維護 {@link State.$overlaps}。
 *
 * 這個全新演算法的一大突破在於再也不需要維護整個樹的 LCA，
 * 因為在演算的過程當中 LCA 會自動被提供出來。
 */
//=================================================================
export const overlapTask = new Task(collision, junctionTask);

/** 本回合當中要被刪除的 {@link Overlap} 之鍵 */
const pendingDelete = new Set<number>();

function collision(): void {
	if(State.$overlaps.size > 0) {
		// 把所有其中一個角片有變動的 Overlap 列為待刪除
		for(const flap of State.$flapChanged) {
			for(const id of State.$overlaps.get(flap.id)!.keys()) {
				pendingDelete.add(getKey(id, flap.id));
			}
		}
	}

	// 找出所有的重疊
	getCollisionOfLCA(State.$tree.$root);

	// 刪除掉所有待刪除的 Overlap
	for(const key of pendingDelete) {
		State.$overlaps.delete(...getPair(key));
	}
	pendingDelete.clear();
}

function getNontrivialDescendant(node: ITreeNode): ITreeNode {
	while(node.$children.$size === 1) {
		node = node.$children.$get()!;
	}
	return node;
}

function getCollisionOfLCA(lca: ITreeNode): void {
	const children = [...lca.$children];
	const l = children.length;
	for(let i = 0; i < l; i++) {
		const a = children[i];
		for(let j = i + 1; j < l; j++) compare(a, children[j], lca);
		if(State.$subtreeAABBChanged.has(a)) {
			getCollisionOfLCA(getNontrivialDescendant(a));
		}
	}
}

function compare(a: ITreeNode, b: ITreeNode, lca: ITreeNode): void {
	// 如果兩個節點的子樹都沒有任何改變，那就不用重新比較了
	if(!State.$subtreeAABBChanged.has(a) && !State.$subtreeAABBChanged.has(b)) return;

	// 碰撞測試
	if(!a.$AABB.$intersects(b.$AABB, dist(a, b, lca))) return;

	// 繼續往下比較
	a = getNontrivialDescendant(a);
	b = getNontrivialDescendant(b);
	const n = a.$children.$size;
	const m = b.$children.$size;
	if(n === 0 && m === 0) {
		// 找到葉點了，加入到輸出之中
		const d = dist(a, b, lca);
		State.$overlaps.set(a.id, b.id, new Overlap(a, b, d));

		// 取消對應鍵的待刪除
		pendingDelete.delete(getKey(a.id, b.id));
	} else {
		// 選擇子點比較少的一邊往下繼續比較，以節省比較次數
		if(m === 0 || n !== 0 && n < m) {
			for(const c of a.$children) compare(c, b, lca);
		} else {
			for(const c of b.$children) compare(a, c, lca);
		}
	}
}

function dist(a: ITreeNode, b: ITreeNode, lca: ITreeNode): number {
	return a.$dist + b.$dist - 2 * lca.$dist;
}
