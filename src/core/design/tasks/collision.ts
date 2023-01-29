import { Task } from "./task";
import { State } from "core/service/state";

import type { ITreeNode } from "../context";

//=================================================================
/**
 * {@link collisionTask} 負責維護 {@link State.$collisions}。
 *
 * 這個全新演算法的一大突破在於再也不需要維護整個樹的 LCA，
 * 因為在演算的過程當中 LCA 會自動被提供出來。
 */
//=================================================================
export const collisionTask = new Task(process);

function process(): void {
	if(State.$collisions.size > 0) {
		// 清除掉有變化的角片碰撞紀錄
		for(const flap of State.$flapAABBChanged) {
			State.$collisions.delete(flap.id);
		}
	}
	getCollisionOfLCA(State.$tree.$root);
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
		State.$collisions.set(a.id, b.id, dist(a, b, lca));
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
