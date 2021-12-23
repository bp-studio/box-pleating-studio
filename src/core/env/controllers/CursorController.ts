import { $getEventCenter } from "./Share";
import { Point } from "bp/math";
import type { IPoint, Vector } from "bp/math";

//////////////////////////////////////////////////////////////////
/**
 * {@link CursorController} 類別負責管理游標的位置。
 */
//////////////////////////////////////////////////////////////////

export namespace CursorController {

	/** 暫存的游標位置，用來比較以確認是否有新的位移 */
	let location: Point = Point.ZERO;

	/** 嘗試更新游標位置並且傳回是否真的有更動 */
	export function $tryUpdate(data: MouseEvent | TouchEvent | Point): boolean {
		if(data instanceof Event) data = _locate(data);
		if(location.eq(data)) return false;
		location.set(data);
		return true;
	}

	/** 傳回跟上次位置的差距、並且同時更新位置 */
	export function $diff(event: MouseEvent | TouchEvent): Vector {
		let pt = _locate(event);
		let diff = pt.sub(location);
		location = pt;
		return diff;
	}

	/** 取得一個指定點到當前游標位置之間的偏移 */
	export function $offset(pt: IPoint): Vector {
		return location.sub(pt);
	}

	function _locate(event: MouseEvent | TouchEvent): Point {
		return new Point($getEventCenter(event));
	}
}
