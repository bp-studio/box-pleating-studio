
//////////////////////////////////////////////////////////////////
/**
 * `ZoomController` 負責控制縮放的操作。
 */
//////////////////////////////////////////////////////////////////

class ZoomController {

	private _studio: BPStudio;

	/** 兩個數字分別代表「兩點觸控的初始距離」和「初始尺度」 */
	private _touchScaling = [0, 0];

	constructor(studio: BPStudio, canvas: HTMLCanvasElement) {
		this._studio = studio;

		canvas.addEventListener("wheel", this._canvasWheel.bind(this));
	}

	private getTouchDistance(event: TouchEvent) {
		let t = event.touches, dx = t[1].pageX - t[0].pageX, dy = t[1].pageY - t[0].pageY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	public init(event: TouchEvent) {
		this._touchScaling = [this.getTouchDistance(event), this._studio.design!.sheet.zoom];
	}

	public process(event: TouchEvent) {
		let sheet = this._studio.design!.sheet;
		let dist = this.getTouchDistance(event);
		let raw = dist - this._touchScaling[0];
		let dpi = window.devicePixelRatio ?? 1;
		let s = sheet.zoom * raw / dpi / 100;
		s = Math.round(s + this._touchScaling[1]);
		this._studio.display.zoom(s, sheet, System.getTouchCenter(event));
		this._touchScaling = [dist, s];
	}

	private _canvasWheel(event: WheelEvent) {
		if(event.ctrlKey || event.metaKey) {
			event.preventDefault();
			let display = this._studio.display;
			let d = this._studio.design;
			if(d) {
				display.zoom(
					d.sheet.zoom - Math.round(d.sheet.zoom * event.deltaY / 10000) * 5,
					d.sheet,
					{ x: event.pageX, y: event.pageY }
				);
			}
		}
	}
}
