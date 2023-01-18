import { canvas } from "client/screen/display";

// 有一些環境不支援這個類別
const TOUCH_SUPPORT = typeof TouchEvent != "undefined";

/** 取得滑鼠或觸控事件的中心點（相較於畫布而言） */
export function $getEventCenter(event: MouseEvent | TouchEvent): IPoint {
	// 這邊我們必須先取得相對於整個頁面的座標，原因有二：
	// 1. 觸控事件並沒有 offsetX offsetY 可用
	// 2. 事件觸發的原點不見得是在畫布上，而可能會暫時移動到外面去
	let pagePoint: IPoint;
	if($isTouch(event)) {
		const t = event.touches;
		if(t.length == 1) {
			pagePoint = { x: t[0].pageX, y: t[0].pageY };
		} else {
			// 超過一點觸控的話，取前兩點的中點就好。三點以上的觸控不管它那麼多。
			pagePoint = { x: (t[1].pageX + t[0].pageX) / 2, y: (t[1].pageY + t[0].pageY) / 2 };
		}
	} else {
		pagePoint = { x: event.pageX, y: event.pageY };
	}
	const rect = canvas.getBoundingClientRect();
	return { x: pagePoint.x - rect.left, y: pagePoint.y - rect.y };
}

export function $round(p: IPoint): IPoint {
	return {
		x: Math.round(p.x),
		y: Math.round(p.y),
	};
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
