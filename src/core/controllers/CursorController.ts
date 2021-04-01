
//////////////////////////////////////////////////////////////////
/**
 * `CursorController` 類別負責管理游標的位置。
 */
//////////////////////////////////////////////////////////////////

namespace CursorController {

	/** 暫存的滑鼠拖曳位置，用來比較以確認是否有新的位移 */
	let location: Point;

	export function update(data: MouseEvent | TouchEvent | Point): boolean {
		if(data instanceof Event) data = _locate(data);
		if(!location) location = data;
		else {
			if(location.eq(data)) return false;
			location.set(data);
		}
		return true;
	}

	export function diff(event: MouseEvent | TouchEvent): Vector {
		let pt = _locate(event);
		let diff = pt.sub(location);
		location = pt;
		return diff;
	}

	export function offset(pt: IPoint): Vector {
		return location.sub(pt);
	}

	function _locate(e: MouseEvent | TouchEvent): Point {
		return System.isTouch(e) ? new Point(System.getTouchCenter(e)) : new Point(e.pageX, e.pageY);
	}
}
