import HotkeyService from "app/services/hotkeyService";
import Studio from "app/services/studioService";

export function zoomStep(currentZoom: number): number {
	const FULL_ZOOM = 100, ZOOM_STEP = 25;
	return 2 ** Math.floor(Math.log2(currentZoom / FULL_ZOOM)) * ZOOM_STEP;
}

function zoom(unit: number): void {
	if(!Studio.project) return;
	const sheet = Studio.project.design.sheet;
	sheet.zoom += unit * zoomStep(sheet.zoom);
}

// on certain keyboards
HotkeyService.register(() => zoom(1), "ZoomIn", false);
HotkeyService.register(() => zoom(-1), "ZoomOut", false);
