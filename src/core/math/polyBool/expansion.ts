import { AAUnion } from "./union/aaUnion";
import { ExChainer } from "./chainer/exChainer";

import type { Path, Polygon, Contour } from "shared/types/geometry";

const expander = new AAUnion(true, new ExChainer());

/**
 * 將輸入的 AA 多邊形膨脹指定的單位，並且產生內外配對的輪廓。
 */
export function expand(polygon: Polygon, units: number): Contour[] {
	const polygons: Polygon[] = polygon.map(path => [expandPath(path, units)]);
	const pathRemain = new Set(Array.from({ length: polygons.length }, (_, i) => i));

	const result = expander.$get(...polygons);
	const contours = result.map(path => {
		const from = path.from!;
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
