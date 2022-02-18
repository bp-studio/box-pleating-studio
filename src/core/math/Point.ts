import { Fraction } from "./Fraction";
import { Couple } from "./Couple";
import { Vector } from "./Vector";
import type { Sign } from "./types";
import type { Rational } from "./Fraction";

/**
 * {@link IPoint} 介面是抽象化的二維點，不包含任何內部實作。
 */
export interface IPoint {
	x: number;
	y: number;
}

//=================================================================
/**
 * {@link Point} 代表的是平面幾何上的一個點。
 */
//=================================================================

export class Point extends Couple implements IPoint {

	/** 傳回一個原點的新實體 */
	public static get ZERO(): Point {
		return new Point(0, 0);
	}

	/**Create a {@link Point} object */
	constructor();
	constructor(c: Couple);
	constructor(p: IPoint);
	constructor(x: Rational, y: Rational);
	constructor(...p: [Couple | IPoint] | [Rational, Rational]) {
		if(p.length == 1) super(p[0].x, p[0].y);
		else super(...p);
	}

	/** Distance to another {@link Point} */
	public $dist(p: Point): number {
		return this.sub(p).$length;
	}

	// /** 傳回 x, y 分量的最大差距 */
	// public paramDist(p: Point) {
	// 	return Math.max(Math.abs(p.x - this.x), Math.abs(p.y - this.y));
	// }

	public sub(v: Vector): Point;
	public sub(p: IPoint): Vector;
	public sub(c: Vector | IPoint): Point | Vector {
		if(c instanceof Vector) return new Point(this._x.sub(c._x), this._y.sub(c._y));
		else if(c instanceof Point) return new Vector(this._x.sub(c._x), this._y.sub(c._y));
		else return new Vector(this._x.sub(new Fraction(c.x)), this._y.sub(new Fraction(c.y)));
	}
	public subBy(v: Vector): this {
		this._x.s(v._x);
		this._y.s(v._y);
		return this;
	}

	public $toPaper(): paper.Point {
		return new paper.Point(this.x, this.y);
	}

	/** {@link Point} 類別的比較允許跟 {@link IPoint} 進行 */
	public eq(p: IPoint): boolean;
	public eq(p?: this | null): boolean;
	public eq(p?: this | null | IPoint): boolean {
		if(p instanceof Point || !p) return super.eq(p);
		return this.x == p.x && this.y == p.y;
	}

	public get $isIntegral(): boolean {
		return this._x.isIntegral && this._y.isIntegral;
	}

	/** 根據指定的相位進行變換 */
	public $transform(fx: Sign, fy: Sign): Point {
		return new Point(this._x.fac(fx), this._y.fac(fy));
	}
}
