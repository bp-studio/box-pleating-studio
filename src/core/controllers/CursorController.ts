
//////////////////////////////////////////////////////////////////
/**
 * `CursorController` 類別負責管理游標的位置。
 */
//////////////////////////////////////////////////////////////////

class CursorController {

	private static _instance: CursorController;
	public static get instance() {
		return CursorController._instance = CursorController._instance || new CursorController();
	}

	/** 暫存的滑鼠拖曳位置，用來比較以確認是否有新的位移 */
	private _lastKnownCursorLocation: Point;

	private constructor() { }

	public get last() {
		return this._lastKnownCursorLocation;
	}

	public set(pt: Point) {
		this._lastKnownCursorLocation = pt;
	}

	public update(event: MouseEvent | TouchEvent) {
		this._lastKnownCursorLocation = this._locate(event);
	}

	public diff(event: MouseEvent | TouchEvent): Vector {
		let pt = this._locate(event);
		let diff = pt.sub(this._lastKnownCursorLocation);
		this._lastKnownCursorLocation = pt;
		return diff;
	}

	private _locate(e: MouseEvent | TouchEvent): Point {
		return System.isTouch(e) ? new Point(System.getTouchCenter(e)) : new Point(e.pageX, e.pageY);
	}
}
