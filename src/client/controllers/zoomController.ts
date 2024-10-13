import ProjectService from "client/services/projectService";
import { FULL_ZOOM, MARGIN } from "client/shared/constant";
import { $getEventCenter } from "./share";
import { display } from "client/screen/display";
import { TapController } from "./tapController";
import { norm } from "shared/types/geometry";

import type { Sheet } from "client/project/components/sheet";

const DELTA_SCALE = 10000;
const STEP = 5;
const ZOOM_THRESHOLD = 2;

//=================================================================
/**
 * {@link ZoomController} manages zooming in/out of the view,
 * including ctrl + mouse wheel zooming, two finger touch zooming,
 * and simply entering a new scale value.
 */
//=================================================================

export namespace ZoomController {

	let _lastTouchDistance = 0;
	let _lastTouchZoom = 0;
	let _zooming: boolean = false;

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
		const dpi = window.devicePixelRatio ?? 1;
		const distDelta = (touchDistance - _lastTouchDistance) / dpi;
		if(!_zooming && Math.abs(distDelta) < ZOOM_THRESHOLD) return;
		_zooming = true;
		TapController.$cancel();

		const zoomDelta = sheet.zoom * distDelta / FULL_ZOOM;
		const newZoom = Math.round(zoomDelta + _lastTouchZoom);
		$zoom(newZoom, sheet, $getEventCenter(event));
		_lastTouchDistance = touchDistance;
		_lastTouchZoom = newZoom;
	}

	export function $end(): void {
		_zooming = false;
	}

	export function $zoom(zoom: number, sheet: Sheet, center?: IPoint): void {
		// Precondition checks
		if(zoom < FULL_ZOOM) zoom = FULL_ZOOM;
		if(sheet.zoom == zoom) return;

		// If the zooming center is not given, use the center of the canvas.
		center ||= { x: display.canvas.clientWidth / 2, y: display.canvas.clientHeight / 2 };

		// Find the coordinates of the zooming center
		const oldScale = ProjectService.scale.value;
		const point = {
			x: sheet.$scroll.x + center.x - MARGIN,
			y: sheet.$scroll.y + center.y - MARGIN,
		};

		sheet.$zoom = zoom; // This will cause the scale to change
		const newScale = ProjectService.scale.value;

		// We have to do this first, or there might not be scrollbars to scroll at all.
		display.scrollView.$updateScrollbar();

		// Calculate the scrolling position and complete the scrolling
		sheet.$scroll = display.scrollView.$scrollTo(
			point.x * newScale / oldScale + MARGIN - center.x,
			point.y * newScale / oldScale + MARGIN - center.y
		);
	}

	export function $wheel(event: WheelEvent): void {
		const sheet = ProjectService.sheet.value;
		if(!sheet) return;
		$zoom(
			sheet.zoom - Math.round(sheet.zoom * event.deltaY / DELTA_SCALE) * STEP,
			sheet,
			{ x: event.offsetX, y: event.offsetY }
		);
	}

	function _getTouchDistance(event: TouchEvent): number {
		const t = event.touches;
		const dx = t[1].pageX - t[0].pageX, dy = t[1].pageY - t[0].pageY;
		return norm(dx, dy);
	}
}
