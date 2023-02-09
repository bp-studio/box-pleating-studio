import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { Task } from "./task";

//=================================================================
/**
 * {@link invalidJunctionTask} 負責非法重疊的計算與維護。
 */
//=================================================================
export const invalidJunctionTask = new Task(invalid);

function invalid(): void {
	for(const junction of State.$junctions.values()) {
		if(junction.$valid) continue;
		const a = junction.$a.id, b = junction.$b.id;
		State.$invalidJunctionDiff.$add(a, b);

		// 如果同樣的 Overlap 已經繪製過了，那就不用繼續
		if(junction.$processed) continue;

		// 計算交集形狀
		Processor.$addJunction(`${a},${b}`, junction.$getPolygon());
	}

	// 經過上述的操作之後，剩下沒有被遍歷過的就是應該要被刪除的
	for(const [a, b] of State.$invalidJunctionDiff.$diff()) {
		Processor.$removeJunction(`${a},${b}`);
	}
}
