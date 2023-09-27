import { display } from "client/screen/display";

// Some environments does not support this class
const TOUCH_SUPPORT = typeof TouchEvent != "undefined";

/** Get the center of a mouse event or a touch event (relative to the canvas) */
export function $getEventCenter(event: MouseEvent | TouchEvent): IPoint {
	/**
	 * We need to obtain the coordinates relative to the page first, for two reasons:
	 * 1. There's no `offsetX` `offsetY` in touch events.
	 * 2. Event origin may not be on the canvas in the case of dragging.
	 */
	let pagePoint: IPoint;
	if($isTouch(event)) {
		const t = event.touches;
		if(t.length == 1) {
			pagePoint = { x: t[0].pageX, y: t[0].pageY };
		} else {
			// For touches more than one point,
			// just take the midpoint of the first two points;
			// we don't care too much about touches with three or more points.
			pagePoint = { x: (t[1].pageX + t[0].pageX) / 2, y: (t[1].pageY + t[0].pageY) / 2 };
		}
	} else {
		pagePoint = { x: event.pageX, y: event.pageY };
	}
	const rect = display.canvas.getBoundingClientRect();
	return { x: pagePoint.x - rect.left, y: pagePoint.y - rect.y };
}

export function $round(p: IPoint): IPoint {
	return {
		x: Math.round(p.x),
		y: Math.round(p.y),
	};
}

/** Check if an event is a touch event. */
export function $isTouch(event: Event): event is TouchEvent {
	return TOUCH_SUPPORT && event instanceof TouchEvent;
}

export enum MouseButton {
	left = 0,
	middle = 1,
	right = 2,
}
