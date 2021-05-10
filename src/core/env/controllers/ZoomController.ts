
//////////////////////////////////////////////////////////////////
/**
 * `ZoomController` 負責控制縮放的操作。
 */
//////////////////////////////////////////////////////////////////

class ZoomController {

	private static readonly _DELTA_SCALE = 10000;
	private static readonly _STEP = 5;

	private _studio: Studio;

	/** 兩個數字分別代表「兩點觸控的初始距離」和「初始尺度」 */
	private _touchScaling = [0, 0];

	constructor(studio: Studio, canvas: HTMLCanvasElement) {
		this._studio = studio;

		canvas.addEventListener("wheel", this._canvasWheel.bind(this));
	}

	public $init(event: TouchEvent) {
		let design = this._studio.$design;
		if(!design) return;
		this._touchScaling = [ZoomController._getTouchDistance(event), design.sheet.zoom];
	}

	public $process(event: TouchEvent) {
		let design = this._studio.$design;
		if(!design) return;

		let sheet = design.sheet;
		let touchDistance = ZoomController._getTouchDistance(event);
		let delta = touchDistance - this._touchScaling[0];
		let dpi = window.devicePixelRatio ?? 1;
		let newZoom = sheet.zoom * delta / dpi / Sheet.$FULL_ZOOM;
		newZoom = Math.round(newZoom + this._touchScaling[1]);
		this._studio.$display.$zoom(newZoom, System.$getEventCenter(event));
		this._touchScaling = [touchDistance, newZoom];
	}

	private static _getTouchDistance(event: TouchEvent) {
		let t = event.touches;
		let dx = t[1].pageX - t[0].pageX, dy = t[1].pageY - t[0].pageY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	private _canvasWheel(event: WheelEvent) {
		if(event.ctrlKey || event.metaKey) {
			event.preventDefault();
			let display = this._studio.$display;
			let design = this._studio.$design;
			if(design) {
				display.$zoom(
					design.sheet.zoom - Math.round(
						design.sheet.zoom * event.deltaY / ZoomController._DELTA_SCALE
					) * ZoomController._STEP,
					{ x: event.pageX, y: event.pageY }
				);
			}
		}
	}
}
