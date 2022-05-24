import { same } from "shared/types/geometry";
import { AAUnion } from "./aaUnion";

import type { Path, Polygon, Contour } from "shared/types/geometry";

/**
 * 將輸入的 AA 多邊形膨脹指定的單位，並且產生內外配對的輪廓。
 */
export function expand(polygon: Polygon, units: number): Contour[] {
	const polygons: Polygon[] = polygon.map(path => [expandPath(path, units)]);
	const pathRemain = new Set(Array.from({ length: polygons.length }, (_, i) => i));

	const contours = new Expansion().$get(...polygons).map(path => {
		const from = path.from!;
		// if(!from || !from.length) debugger;
		return {
			outer: path,
			inner: from.map(n => {
				pathRemain.delete(n);
				return polygon[n];
			}),
			isHole: polygons[from[0]][0].isHole,
		};
	});

	// 剩下沒有被對應到的路徑就是膨脹之後消失的洞，補上去
	for(const n of pathRemain) {
		contours.push({
			outer: [],
			inner: [polygon[n]],
			isHole: true,
		});
	}

	return contours;
}

/**
 * 根據指定的單位膨脹一個路徑，過程當中順便判斷這個路徑是不是一個洞。
 *
 * 判定的原理很簡單：路徑當中 x 值最小的點如果結果往右移動那就是洞。
 */
function expandPath(path: Path, units: number): Path {
	const l = path.length;
	const result: Path = [];
	let minX = Number.POSITIVE_INFINITY, minXDelta: number = 0;
	for(let i = 0; i < l; i++) {
		// 決定頂點偏移的方向；這邊我們假定了輸入的多邊形非退化
		const p = path[i];
		const p1 = path[(i + l - 1) % l], p2 = path[(i + 1) % l];
		const dx = Math.sign(p2.y - p1.y) * units;
		const dy = Math.sign(p1.x - p2.x) * units;
		if(p.x < minX) {
			minX = p.x;
			minXDelta = dx;
		}
		result.push({ x: p.x + dx, y: p.y + dy });
	}
	if(minXDelta > 0) result.isHole = true;
	return result;
}

//=================================================================
/**
 * {@link Expansion} 是 {@link AAUnion} 的變化形，專門負責將既有 AA 多邊形進行膨脹，
 * 同時追蹤產生的每一個多邊形跟原有的多邊形之間的關係。
 */
//=================================================================

class Expansion extends AAUnion {

	constructor() { super(true); }

	/** 將收集到的邊串接成最終結果 */
	protected override _chain(): Polygon {
		const chains: Polygon = [];
		const result: Polygon = [];
		while(this._unionEdges.length) {
			const edge = this._unionEdges.pop()!;

			/**
			 * 這邊採用線性搜尋的方式檢查所有的 chain，這乍看非常沒效率，
			 * 但實務上 chains 的大小頂多兩三個而已，所以不需要更進一步改進。
			 */
			const tailIndex = chains.findIndex(p => same(p[0], edge[1]));
			const headIndex = chains.findIndex(p => same(p[p.length - 1], edge[0]));
			const tail = chains[tailIndex], head = chains[headIndex];

			if(head && tail) {
				if(head === tail) {
					// 一個 chain 頭尾銜接起來了，加入到輸出結果當中
					result.push(head);
					head.from = [...head.temp!];
					delete head.temp;
					chains.splice(headIndex, 1);
				} else {
					// 串接兩個本來獨立的 chain
					head.push(...tail);
					for(const n of tail.temp!) head.temp!.add(n);
					chains.splice(tailIndex, 1);
				}
			} else if(head) {
				head.push(edge[1]);
				head.temp!.add(edge[2]);
			} else if(tail) {
				tail.unshift(edge[0]);
				tail.temp!.add(edge[2]);
			} else {
				const path: Path = [edge[0], edge[1]];
				path.temp = new Set();
				chains.push(path);
			}
		}
		return result;
	}
}
