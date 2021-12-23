import type { IPoint } from "bp/math";

// 有一些環境不支援這個類別
const TOUCH_SUPPORT = typeof TouchEvent != 'undefined';

export function $getEventCenter(event: MouseEvent | TouchEvent): IPoint {
	if($isTouch(event)) {
		let t = event.touches;
		return { x: (t[1].pageX + t[0].pageX) / 2, y: (t[1].pageY + t[0].pageY) / 2 };
	} else {
		return { x: event.pageX, y: event.pageY };
	}
}

export function $isTouch(event: Event): event is TouchEvent {
	return TOUCH_SUPPORT && event instanceof TouchEvent;
}

export const $LEFT = 0;
export const $MIDDLE = 1;
export const $RIGHT = 2;
