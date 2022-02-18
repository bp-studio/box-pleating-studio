import { Point } from "./Point";
import type { PolyBool } from "./polyBool";

//=================================================================
/**
 * {@link Rectangle} 代表的是平面幾何上的一個位置明確的矩形。
 */
//=================================================================

export class Rectangle {

	/** 矩形左下角的點 */
	private readonly p1: Point;

	/** 矩形右上角的點 */
	private readonly p2: Point;

	constructor(p1: Point, p2: Point) {
		if(p1._x.gt(p2._x)) [p1, p2] = [p2, p1];
		if(p1._y.gt(p2._y)) [p1, p2] = [new Point(p1._x, p2._y), new Point(p2._x, p1._y)];
		[this.p1, this.p2] = [p1, p2];
	}

	public $contains(rec: Rectangle): boolean {
		return this.p1._x.le(rec.p1._x) && this.p1._y.le(rec.p1._y) &&
			this.p2._x.ge(rec.p2._x) && this.p2._y.ge(rec.p2._y);
	}

	public eq(rec: Rectangle): boolean {
		return this.p1.eq(rec.p1) && this.p2.eq(rec.p2);
	}

	public get width(): number { return this.p2._x.sub(this.p1._x).$value; }
	public get height(): number { return this.p2._y.sub(this.p1._y).$value; }
	public get top(): number { return this.p2.y; }
	public get right(): number { return this.p2.x; }

	/** 產生順時鐘的路徑 */
	public $toPolyBoolPath(): PolyBool.Path {
		return [
			[this.p1.x, this.p1.y],
			[this.p1.x, this.p2.y],
			[this.p2.x, this.p2.y],
			[this.p2.x, this.p1.y],
		];
	}
}
