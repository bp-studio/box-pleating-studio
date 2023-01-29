import { HeapSet } from "shared/data/heap/heapSet";

import type { ITreeNode } from "../context";
import type { distanceTask } from "./distance";
import type { heightTask } from "./height";

/**
 * 由下往上更新樹狀結構相關變數的方法。
 *
 * 原則上，使用這個方法的工作都必須要間接相依於 {@link distanceTask}，
 * 因為它是根據更新之後的 {@link TreeNode.$dist} 在對頂點進行排序的；
 * 但有一個例外是 {@link heightTask}，因為它是用平衡之前的 {@link TreeNode.$dist} 在排序的。
 *
 * @param set 更新起點的集合。
 * @param updater 節點更新器，傳回真值表示要繼續處理其父點。
 */
export function climb<T extends ITreeNode>(updater: Func<T, boolean>, ...sets: ReadonlySet<T>[]): void {
	const total = sets.reduce((v, s) => v + s.size, 0);
	if(total === 0) return;
	if(total === 1) {
		// 進行單線的更新
		let n = sets.find(s => s.size === 1)!.values().next().value;
		while(updater(n) && n.$parent) n = n.$parent as T;
	} else {
		// 初始化
		const heap = new HeapSet<T>((a, b) => b.$dist - a.$dist);
		for(const set of sets) {
			for(const n of set) heap.$insert(n);
		}

		// 爬樹
		while(!heap.$isEmpty) {
			const n = heap.$pop()!;
			if(updater(n) && n.$parent) heap.$insert(n.$parent as T);
		}
	}
}
