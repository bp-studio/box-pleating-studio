import { HeapSet } from "shared/data/heap/heapSet";

import type { ITreeNode } from "../context";

/**
 * 由下往上更新樹狀結構相關變數的方法。
 * @param set 更新起點的集合。
 * @param updater 節點更新器，傳回真值表示要繼續處理其父點。
 */
export function climb<T extends ITreeNode>(updater: Func<T, boolean>, ...sets: ReadonlySet<T>[]): void {
	const total = sets.reduce((v, s) => v + s.size, 0);
	if(total === 0) return;
	if(total === 1) {
		let n = sets.find(s => s.size === 1)!.values().next().value;
		while(updater(n) && n.$parent) n = n.$parent as T;
	} else {
		// 初始化
		const heap = new HeapSet<T>((a, b) => b.$dist - a.$dist);
		for(const set of sets) for(const n of set) heap.$insert(n);

		// 爬樹
		while(!heap.$isEmpty) {
			const n = heap.$pop()!;
			if(updater(n) && n.$parent) heap.$insert(n.$parent as T);
		}
	}
}
