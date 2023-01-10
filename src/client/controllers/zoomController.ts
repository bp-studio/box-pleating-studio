import ProjectService from "client/services/projectService";
import { FULL_ZOOM } from "client/shared/constant";

import type { Workspace } from "client/screen/workspace";

const DELTA_SCALE = 10000;
const STEP = 5;

export namespace ZoomController {

	let _canvas: HTMLCanvasElement;
	let _workspace: Workspace;

	export function $setup(canvas: HTMLCanvasElement, workspace: Workspace): void {
		canvas.addEventListener("wheel", wheel);
		_canvas = canvas;
		_workspace = workspace;
	}

	function wheel(event: WheelEvent): void {
		if(event.ctrlKey || event.metaKey) {
			event.preventDefault();
			const sheet = ProjectService.sheet.value;
			if(!sheet) return;
			$zoom(
				sheet.zoom - Math.round(sheet.zoom * event.deltaY / DELTA_SCALE) * STEP,
				{ x: event.offsetX, y: event.offsetY }
			);
		}
	}

	export function $zoom(zoom: number, center?: IPoint): void {
		// 檢查
		if(zoom < FULL_ZOOM) zoom = FULL_ZOOM;
		const sheet = ProjectService.sheet.value;
		if(!sheet || sheet.zoom == zoom) return;

		// 如果沒有指定縮放中心，預設為畫布的中心
		center ||= { x: _canvas.clientWidth / 2, y: _canvas.clientHeight / 2 };

		_workspace.$zoom(zoom, center);
	}
}
