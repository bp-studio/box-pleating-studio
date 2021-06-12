
//////////////////////////////////////////////////////////////////
/**
 * `Matrix` 是由 `Fraction` 構成的二階矩陣，負責進行高精度變換計算。
 */
//////////////////////////////////////////////////////////////////

class Matrix {

	private a: Fraction; private b: Fraction;
	private c: Fraction; private d: Fraction;

	private readonly _det: Fraction;

	constructor(a: Fraction, b: Fraction, c: Fraction, d: Fraction, det?: Fraction) {
		this.a = a.c(); this.b = b.c();
		this.c = c.c(); this.d = d.c();
		if(det) this._det = det;
		else this._det = this.a.mul(this.d).s(this.b.mul(this.c));
	}

	toString() { return [this.a, this.b, this.c, this.d].toString(); }

	// /** 矩陣的行列式值轉換成數值 */
	// get determinant(): number { return this.det.$value; }

	/** 傳回反矩陣作為新的矩陣實體 */
	get $inverse(): Matrix | null {
		if(this._det.eq(Fraction.ZERO)) return null;
		return new Matrix(
			this.d.div(this._det), this.b.neg.d(this._det),
			this.c.neg.d(this._det), this.a.div(this._det),
			this._det.inv
		);
	}

	/** 矩陣乘法；暫時因為用不到所以沒有實作矩陣對矩陣的乘法 */
	public $multiply(p: Point): Point;
	public $multiply(v: Vector): Vector;
	public $multiply(that: Point | Vector) {
		return new that.constructor(
			this.a.mul(that._x).a(this.b.mul(that._y)),
			this.c.mul(that._x).a(this.d.mul(that._y))
		);
	}

	/** 求出會把 from 變成 to 的旋轉縮放矩陣 */
	public static $getTransformMatrix(from: Vector, to: Vector) {
		if(from.eq(Vector.ZERO)) throw new Error("Cannot transform zero vector.");
		let M = new Matrix(from._x, from._y.neg, from._y, from._x);
		let { _x: a, _y: b } = M.$inverse!.$multiply(to);
		return new Matrix(a, b.neg, b, a);
	}
}
