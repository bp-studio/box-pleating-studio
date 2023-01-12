import ProjectService from "client/services/projectService";
import { FULL_ZOOM } from "client/shared/constant";
import { MARGIN } from "client/screen/constants";
import { $getEventCenter } from "./share";
import { canvas, scrollView } from "client/screen/display";

const DELTA_SCALE = 10000;
const STEP = 5;

//=================================================================
/**
 * {@link ZoomController} 負責控制縮放，包括滑鼠滾輪縮放、二指觸控縮放、
 * 以及單純輸入縮放數值。
 */
//=================================================================

export namespace ZoomController {

	let _lastTouchDistance = 0;
	let _lastTouchZoom = 0;

	export function $init(event: TouchEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;
		_lastTouchDistance = _getTouchDistance(event);
		_lastTouchZoom = sheet.zoom;
	}

	export function $process(event: TouchEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;

		const touchDistance = _getTouchDistance(event);
		const distDelta = touchDistance - _lastTouchDistance;
		const dpi = window.devicePixelRatio ?? 1;
		const zoomDelta = sheet.zoom * distDelta / dpi / FULL_ZOOM;
		const newZoom = Math.round(zoomDelta + _lastTouchZoom);
		$zoom(newZoom, $getEventCenter(event));
		_lastTouchDistance = touchDistance;
		_lastTouchZoom = newZoom;
	}

	export function $zoom(zoom: number, center?: IPoint): void {
		// 檢查
		if(zoom < FULL_ZOOM) zoom = FULL_ZOOM;
		const sheet = ProjectService.sheet.value;
		if(!sheet || sheet.zoom == zoom) return;

		// 如果沒有指定縮放中心，預設為畫布的中心
		center ||= { x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 };

		// 求出縮放中心對應的座標
		const oldScale = ProjectService.scale.value; // 舊值
		const point = {
			x: sheet.$scroll.x + center.x - sheet.$horizontalMargin,
			y: sheet.$scroll.y + center.y - MARGIN,
		};

		sheet.$zoom = zoom; // 會使得 scale 改變
		const newScale = ProjectService.scale.value; // 新值

		// 必須先進行下面這一步，否則可能根本沒有捲軸可以捲
		scrollView.$updateScrollbar();

		// 根據座標逆算出捲動的位置，並完成捲動
		sheet.$scroll = scrollView.$scrollTo(
			point.x * newScale / oldScale + sheet.$horizontalMargin - center.x,
			point.y * newScale / oldScale + MARGIN - center.y
		);
	}

	export function $wheel(event: WheelEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;
		$zoom(
			sheet.zoom - Math.round(sheet.zoom * event.deltaY / DELTA_SCALE) * STEP,
			{ x: event.offsetX, y: event.offsetY }
		);
	}

	function _getTouchDistance(event: TouchEvent): number {
		const t = event.touches;
		const dx = t[1].pageX - t[0].pageX, dy = t[1].pageY - t[0].pageY;
		return Math.sqrt(dx * dx + dy * dy);
	}
}
