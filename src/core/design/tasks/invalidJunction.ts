
import { RRIntersection } from "core/math/polyBool/intersection/rrIntersection";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { Task } from "./task";

import type { Polygon } from "shared/types/geometry";

//=================================================================
/**
 * {@link invalidJunctionTask} 負責非法重疊的計算與維護。
 */
//=================================================================
export const invalidJunctionTask = new Task(invalid);

const intersection = new RRIntersection();

function invalid(): void {
	for(const overlap of State.$junctions.values()) {
		if(overlap.$valid) continue;
		const A = overlap.$a, B = overlap.$b;
		State.$invalidJunctionDiff.$add(A.id, B.id);

		// 如果同樣的 Overlap 已經繪製過了，那就不用繼續
		if(overlap.$processed) continue;

		// 計算交集形狀
		const dist = overlap.$dist - A.$length - B.$length;
		const result: Polygon = [];
		result.push(intersection.$get(A.$AABB.$toRoundedRect(0), B.$AABB.$toRoundedRect(dist))[0]);
		if(dist > 0) result.push(intersection.$get(A.$AABB.$toRoundedRect(dist), B.$AABB.$toRoundedRect(0))[0]);
		Processor.$addJunction(`${A.id},${B.id}`, result);
		overlap.$processed = true;
	}

	// 經過上述的操作之後，剩下沒有被遍歷過的就是應該要被刪除的
	for(const [a, b] of State.$invalidJunctionDiff.$diff()) {
		Processor.$removeJunction(`${a},${b}`);
	}
}
