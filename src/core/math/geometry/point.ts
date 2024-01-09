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

	/** The origin. */
	public static readonly ZERO = new Point(0, 0);

	/** Create a {@link Point} object */
	constructor();
	constructor(p: IPoint);
	constructor(x: Rational, y: Rational);
	constructor(...p: [IPoint] | [Rational, Rational]) {
		if(p[0] instanceof Couple) super(p[0]._x, p[0]._y);
		else if(p.length == 1) super(p[0].x, p[0].y);
		else super(...p);
	}

	/** Distance to another {@link Point} */
	public $dist(p: Point): number {
		return this.$sub(p).$length;
	}

	public $sub(v: Vector): Point;
	public $sub(p: Point): Vector;
	public $sub(c: Vector | Point): Point | Vector {
		if(c instanceof Vector) return new Point(this._x.sub(c._x), this._y.sub(c._y));
		else return new Vector(this._x.sub(c._x), this._y.sub(c._y));
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

	///#if DEBUG

	public static $parseTest(p: string): Point {
		const match = p.match(/^\((-?\d+)(?:\/(\d+))?, (-?\d+)(?:\/(\d+))?\)$/)!;
		const x = new Fraction(Number(match[1]), Number(match[2] || 1) as Positive);
		const y = new Fraction(Number(match[3]), Number(match[4] || 1) as Positive);
		return new Point(x, y);
	}

	///#endif
}
