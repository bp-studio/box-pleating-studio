import { Fraction } from "../fraction";
import { Couple } from "./couple";
import { Vector } from "./vector";

import type { Rational } from "../fraction";

//=================================================================
/**
 * {@link Point} represents a 2D point.
 */
//=================================================================

export class Point extends Couple implements IPoint {

	/** Returns a new instance of the origin. */
	public static get ZERO(): Point {
		return new Point(0, 0);
	}

	/** Create a {@link Point} object */
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

	/** {@link Point} is allowed to be compared with {@link IPoint}s. */
	public override eq(p: IPoint): boolean;
	public override eq(p?: this | null): boolean;
	public override eq(p?: this | null | IPoint): boolean {
		if(p instanceof Point || !p) return super.eq(p);
		return this.x == p.x && this.y == p.y;
	}

	public get $isIntegral(): boolean {
		return this._x.isIntegral && this._y.isIntegral;
	}

	/** Transform by the given orientation. */
	public $transform(fx: Sign, fy: Sign): Point {
		return new Point(this._x.fac(fx), this._y.fac(fy));
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Debug methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	///#if DEBUG==true

	public static $parseTest(p: unknown): Point {
		if(typeof p != "string") throw new Error("Incorrect type");
		const match = p.match(/^\((\d+)(?:\/(\d+))?, (\d+)(?:\/(\d+))?\)$/);
		if(!match) throw new Error("Incorrect format");
		const x = new Fraction(Number(match[1]), Number(match[2] || 1));
		const y = new Fraction(Number(match[3]), Number(match[4] || 1));
		return new Point(x, y);
	}

	///#endif
}
