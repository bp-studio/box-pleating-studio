
//////////////////////////////////////////////////////////////////
/**
 * `ZoomController` 負責控制縮放的操作。
 */
//////////////////////////////////////////////////////////////////

class ZoomController {

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
		this._touchScaling = [this._getTouchDistance(event), design.sheet.zoom];
	}

	public $process(event: TouchEvent) {
		let design = this._studio.$design;
		if(!design) return;

		let sheet = design.sheet;
		let touchDistance = this._getTouchDistance(event);
		let delta = touchDistance - this._touchScaling[0];
		let dpi = window.devicePixelRatio ?? 1;
		let newZoom = sheet.zoom * delta / dpi / 100;
		newZoom = Math.round(newZoom + this._touchScaling[1]);
		this._studio.$display.$zoom(newZoom, sheet, System.$getEventCenter(event));
		this._touchScaling = [touchDistance, newZoom];
	}

	private _getTouchDistance(event: TouchEvent) {
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
					design.sheet.zoom - Math.round(design.sheet.zoom * event.deltaY / 10000) * 5,
					design.sheet,
					{ x: event.pageX, y: event.pageY }
				);
			}
		}
	}
}
