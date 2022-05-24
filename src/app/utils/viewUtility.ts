
export function zoomStep(zoom: number): number {
	const FULL_ZOOM = 100, ZOOM_STEP = 25;
	return 2 ** Math.floor(Math.log2(zoom / FULL_ZOOM)) * ZOOM_STEP;
}
