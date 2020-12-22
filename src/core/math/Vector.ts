
//////////////////////////////////////////////////////////////////
/**
 * `Vector` 代表的是平面幾何上的向量。
 */
//////////////////////////////////////////////////////////////////

class Vector extends Couple {

	/** 傳回一個零向量的新實體 */
	public static get ZERO(): Vector {
		return new Vector(0, 0);
	}

	/**Create a Vector object */
	constructor();
	constructor(c: Couple);
	constructor(p: IPoint);
	constructor(x: Rational, y: Rational);
	constructor(...p: [Couple | IPoint, undefined?] | [Rational, Rational]) {
		if(p[1] === undefined) super(p[0].x, p[0].y);
		else super(...p);
	}

	/** 傳回向量的浮點數長度 */
	public get length(): number {
		return Math.sqrt(this.dot(this));
	}

	/** 傳回向量的有理數斜率 */
	public get slope(): Fraction {
		return this._y.div(this._x);
	}

	/** 把向量逆時鐘轉 90 度 */
	public rotate90(): Vector {
		return new Vector(this._y.neg, this._x);
	}

	/**
	 * 傳回長度為 1 的同方向向量。
	 *
	 * 這邊隱約假定此向量是軸平行摺痕的方向向量，亦即其長度實際上是有理數。
	 */
	public normalize(): Vector {
		return this.scale(new Fraction(this.length).inv);
	}

	/** 縮放並傳回新的向量 */
	public scale(r: Rational): Vector;
	public scale(c: Couple): Vector;
	public scale(x: Rational, y: Rational): Vector;
	public scale(x: Rational | Couple, y?: Rational): Vector {
		if(x instanceof Couple) return this.scale(x._x, x._y);
		if(!y) y = x;
		return new Vector(this._x.mul(x), this._y.mul(y)).smp();
	}

	/** 計算向量內積 */
	public dot(v: Vector): number {
		return this._x.mul(v._x).a(this._y.mul(v._y)).value;
	}

	/** 取向量的負值並傳回新的向量 */
	public get neg(): Vector {
		return new Vector(this._x.neg, this._y.neg);
	}

	/** 傳回向量的主輻角，以 radians 為單位，範圍是 ±π/2 */
	public get angle(): number {
		return Math.atan2(this.y, this.x);
	}

	/**
	 * 化簡向量並傳回同方向但是座標為整數的新向量。
	 *
	 * 視原向量的分母而定，新向量的大小可能遠比本來的向量更大。
	 */
	public reduce(): Vector {
		let [nx, ny] = [this._x.$numerator, this._y.$numerator];
		let [dx, dy] = [this._x.$denominator, this._y.$denominator];
		let [x, y] = MathUtil.reduce(nx * dy, ny * dx);
		return new Vector(Number(x), Number(y));
	}

	/**
	 * 放大兩倍主輻角，並且傳回新的向量。
	 *
	 * 請注意新向量與原向量的長度之間沒有任何關聯。
	 * @param fx 傳入 -1 表示要把位於二三象限的向量朝反方向放大；預設值為 1。`fy` 因為會在算式中抵銷，無須帶入。
	 */
	public doubleAngle(fx: number = 1): Vector {
		let { x, y } = this.reduce();
		[x, y] = MathUtil.reduce(x * x - y * y, 2 * x * y);
		return new Vector(fx * x, fx * y);
	}

	// 這個似乎用不到了
	// /** 原地對調 x, y 值 */
	// public flip(): Vector {
	// 	[this._x, this._y] = [this._y, this._x];
	// 	return this;
	// }

	/** 檢查自身跟傳入的向量是否平行 */
	public parallel(v: Vector): boolean {
		return this._x.mul(v._y).eq(this._y.mul(v._x));
	}

	/**
	 * 計算兩個向量的角平分向量。
	 *
	 * 這個演算法有假定一個前提是「傳入的向量都是 GOPS 的軸平行摺痕向量」，
	 * 因此計算過程中的 z1 和 z2 一定會是整數。
	 */
	public static bisector(v1: Vector, v2: Vector): Vector {
		let [x1, y1] = MathUtil.reduce(v1.x, v1.y);
		let [x2, y2] = MathUtil.reduce(v2.x, v2.y);
		let z1 = Math.sqrt(x1 * x1 + y1 * y1);
		let z2 = Math.sqrt(x2 * x2 + y2 * y2);
		return new Vector(x1 * z2 + x2 * z1, y1 * z2 + y2 * z1);
	}
}
