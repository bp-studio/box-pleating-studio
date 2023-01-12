
// 有一些環境不支援這個類別
const TOUCH_SUPPORT = typeof TouchEvent != "undefined";

/** 取得滑鼠或觸控事件的中心點（相較於頁面而言） */
export function $getEventCenter(event: MouseEvent | TouchEvent): IPoint {
	if($isTouch(event)) {
		const t = event.touches;
		if(t.length == 1) return { x: t[0].pageX, y: t[0].pageY };
		return { x: (t[1].pageX + t[0].pageX) / 2, y: (t[1].pageY + t[0].pageY) / 2 };
	} else {
		return { x: event.pageX, y: event.pageY };
	}
}

/** 檢查一個事件是否為觸控事件 */
export function $isTouch(event: Event): event is TouchEvent {
	return TOUCH_SUPPORT && event instanceof TouchEvent;
}

export enum MouseButton {
	left = 0,
	middle = 1,
	right = 2,
}
