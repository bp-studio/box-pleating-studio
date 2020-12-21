
//////////////////////////////////////////////////////////////////
/**
 * 雖然頂點跟二維向量是很類似的物件，但是它們的幾何意義是完全不同的，
 * 所以我把它們定義成兩個類別，都衍生自這個 `Couple` 基底類別。
 *
 * `Couple` 類別儲存的 x, y 值是 `Fraction`，而不是一般的數值，
 * 這使得引用它的類別（例如 `Line`）可以作高精度的計算。
 */
//////////////////////////////////////////////////////////////////

abstract class Couple {

	public _x: Fraction;
	public _y: Fraction;

	/**Create a Couple object */
	constructor(c: Couple);
	constructor(x: Rational, y: Rational);
	constructor(...p: [Couple, undefined?] | [Rational, Rational]) {
		if(p[1] === undefined) p = [p[0]._x, p[0]._y];
		this._x = new Fraction(p[0]);
		this._y = new Fraction(p[1]);
	}

	public get x() { return this._x.value; }
	public set x(v: number) { this._x = new Fraction(v); }
	public get y() { return this._y.value; }
	public set y(v: number) { this._y = new Fraction(v); }

	public smp(): this {
		this._x.smp();
		this._y.smp();
		return this;
	}

	// Specify `c` as type `this` will block any calling of this method
	// between different derivative classes, which is the desired behavior
	public eq(c?: this | null): boolean {
		if(!c) return false;
		return this._x.eq(c._x) && this._y.eq(c._y);
	}

	public clone(): this {
		return new this.constructor(this._x, this._y);
	}

	/** Print out the Couple in the "(x, y)" format */
	public toString() { return "(" + this._x + ", " + this._y + ")"; }

	public toJSON() {
		return this.toString();
	}

	public set(c: this): this;
	public set(x: Rational, y: Rational): this;
	public set(x: Rational | this, y: Rational = 0) {
		if(x instanceof Couple) {
			this._x = new Fraction(x._x);
			this._y = new Fraction(x._y);
		} else {
			this._x = new Fraction(x);
			this._y = new Fraction(y);
		};
		return this;
	}

	public add(v: Vector): this {
		return new this.constructor(this._x.add(v._x), this._y.add(v._y)).smp();
	}

	public addBy(v: Vector): this {
		this._x.a(v._x); this._y.a(v._y); return this.smp();
	}

	/** 把 `Couple` 四捨五入至最接近的位數（預設為個位） */
	public round(scale = 1) {
		this._x.d(scale).r().m(scale); this._y.d(scale).r().m(scale);
		return this.smp();
	}

	/** Restrict the Couple to a certain rectangular range */
	public range(min_X: Rational, max_X: Rational, min_Y: Rational, max_Y: Rational) {
		if(this._x.lt(min_X)) this._x = new Fraction(min_X);
		if(this._x.gt(max_X)) this._x = new Fraction(max_X);
		if(this._y.lt(min_Y)) this._y = new Fraction(min_Y);
		if(this._y.gt(max_Y)) this._y = new Fraction(max_Y);
		return this;
	}

	/** 把自己轉換成 IPoint 介面 */
	public toIPoint(): IPoint {
		return { x: this.x, y: this.y };
	}
}

// 這個宣告幫助 TypeScript 辨識當前的建構子型別
interface Couple {
	constructor: new (x: Fraction, y: Fraction) => this;
}
