
//////////////////////////////////////////////////////////////////
/**
 * `Point` 代表的是平面幾何上的一個點。
 */
//////////////////////////////////////////////////////////////////

class Point extends Couple implements IPoint {

	/** 傳回一個原點的新實體 */
	public static get ZERO(): Point {
		return new Point(0, 0);
	}

	/**Create a Point object */
	constructor();
	constructor(c: Couple);
	constructor(p: IPoint);
	constructor(x: Rational, y: Rational);
	constructor(...p: [Couple | IPoint] | [Rational, Rational]) {
		if(p.length == 1) super(p[0].x, p[0].y);
		else super(...p);
	}

	/**Distance to another Point */
	public dist(p: Point): number {
		return this.sub(p).length;
	}

	/** 傳回 x, y 分量的最大差距 */
	public paramDist(p: Point) {
		return Math.max(Math.abs(p.x - this.x), Math.abs(p.y - this.y));
	}

	public sub(v: Vector): Point;
	public sub(p: IPoint): Vector;
	public sub(c: Vector | IPoint) {
		if(c instanceof Vector) return new Point(this._x.sub(c._x), this._y.sub(c._y)).smp();
		else if(c instanceof Point) return new Vector(this._x.sub(c._x), this._y.sub(c._y)).smp();
		else return new Vector(this._x.sub(c.x), this._y.sub(c.y)).smp();
	}
	public subBy(v: Vector): this {
		this._x.s(v.x);
		this._y.s(v.y);
		return this;
	}

	public toPaper(): paper.Point {
		return new paper.Point(this.x, this.y);
	}

	/** Point 類別的比較允許跟 IPoint 進行 */
	public eq(p: IPoint): boolean;
	public eq(p?: this | null): boolean;
	public eq(p?: this | null | IPoint): boolean {
		if(p instanceof Point || !p) return super.eq(p);
		return this.x == p.x && this.y == p.y;
	}

	public get isIntegral(): boolean {
		return this._x.$denominator === BIG1 && this._y.$denominator === BIG1;
	}

	public transform(fx: number, fy: number): Point {
		return new Point(this._x.mul(fx), this._y.mul(fy));
	}
}
