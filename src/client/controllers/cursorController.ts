import { same } from "shared/types/geometry";
import { $getEventCenter } from "./share";

//=================================================================
/**
 * {@link CursorController} 類別負責管理游標的位置。
 */
//=================================================================

export namespace CursorController {

	/** 暫存的游標位置，用來比較以確認是否有新的位移 */
	let location: IPoint = { x: 0, y: 0 };

	/** 嘗試更新游標位置並且傳回是否真的有更動 */
	export function $tryUpdate(data: MouseEvent | TouchEvent | IPoint): boolean {
		if(data instanceof Event) data = $getEventCenter(data);
		if(same(location, data)) return false;
		location = data;
		return true;
	}

	/** 傳回跟上次位置的差距、並且同時更新位置 */
	export function $diff(event: MouseEvent | TouchEvent): IPoint {
		const pt = $getEventCenter(event);
		const diff = { x: pt.x - location.x, y: pt.y - location.y };
		location = pt;
		return diff;
	}

	/** 取得一個指定點到當前游標位置之間的偏移 */
	export function $offset(pt: IPoint): IPoint {
		return { x: location.x - pt.x, y: location.y - pt.y };
	}
}
