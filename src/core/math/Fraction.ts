
// 對於不支援 BigInt 的環境直接使用普通的整數型態；
// 理論上如果 GOPS 的程式不要出錯，這樣做也不至於會有問題
window.BigInt = window.BigInt || ((n: number) => n) as any;

const BIG1 = BigInt(1);

//////////////////////////////////////////////////////////////////
/**
 * 代表一個有理分數。
 *
 * 這個類別的內部實作使用 bigint 類別來紀錄分子分母，以容許無限精度。
 */
//////////////////////////////////////////////////////////////////

class Fraction {

	/** 分子，可正可負 */
	private _p: bigint;

	/** 分母，恆正 */
	private _q: bigint;

	constructor(value: Rational);
	constructor(numerator: number, denominator: number);
	constructor(numerator: bigint, denominator: bigint);
	constructor(n: Rational | bigint, d: number | bigint = 1) {
		if(n instanceof Fraction) { this._p = n._p; this._q = n._q * BigInt(d); }
		else if(typeof n == 'bigint' && typeof d == 'bigint') { this._p = n; this._q = d; }
		else if(typeof n == 'bigint' && d === 1) { this._p = n; this._q = BIG1; }
		else if(typeof n == 'number' && typeof d == 'number') {
			if(Number.isSafeInteger(n) && Number.isSafeInteger(d)) { this._p = BigInt(n); this._q = BigInt(d); }
			else if(!Number.isFinite(n / d)) {
				debugger;
				throw new Error("Parameters are not valid");
			}
			else { let f = Fraction.toFraction(n / d); this._p = f._p; this._q = f._q; }
		} else {
			debugger;
			throw new Error("Parameters are not valid");
		}
	}

	private static toFraction(v: number, k2 = 1, k1 = 0): Fraction {
		let n = Math.floor(v), r = v - n, k0 = n * k1 + k2;
		if(r / k0 / ((1 - r) * k0 + k1) < Fraction.ERROR) return new Fraction(n);
		else return Fraction.toFraction(1 / r, k1, k0).i().a(n);
	}

	/** 把浮點數轉換成有理數時的可允許誤差範圍 */
	private static readonly ERROR = 1e-12;

	public get $numerator(): bigint { return this._p; }
	public get $denominator(): bigint { return this._q; }

	/////////////////////////////////
	// Core members
	/////////////////////////////////

	/** The value of the fraction as number */
	public get value(): number { return Number(this._p) / Number(this._q); }

	/** Output the fraction in the format of `p/q` (in lowest terms), or just `p` if `q` equals 1. */
	public toString(): string { this.smp(); return this._p + (this._q > 1 ? "/" + this._q : ""); }

	/** Clone */
	public c(): Fraction { return new Fraction(this._p, this._q); }

	/////////////////////////////////
	// Single operation methods
	/////////////////////////////////

	/** Simplification in place */
	public smp(): this {
		[this._p, this._q] = MathUtil.reduce(this._p, this._q);
		return this._check();
	}

	/** Negation in place */
	public n(): this { this._p = -this._p; return this; }

	/** Inversion in place */
	public i(): this { [this._p, this._q] = [this._q, this._p]; return this; }

	/** Round to the nearest integer in place */
	public r(): this {
		this._p = BigInt(Math.round(this.value));
		this._q = BIG1;
		return this;
	}

	/////////////////////////////////
	// Arithmetic methods
	/////////////////////////////////

	/** Addition in place */
	public a(v: Rational): this {
		if(v instanceof Fraction) { this._p = this._p * v._q + this._q * v._p; this._q *= v._q; }
		else if(Number.isInteger(v)) this._p += BigInt(v) * this._q;
		else this.a(new Fraction(v));
		return this;
	}

	/** Subtraction in place */
	public s(v: Rational): this {
		if(v instanceof Fraction) { this._p = this._p * v._q - this._q * v._p; this._q *= v._q; }
		else if(Number.isInteger(v)) this._p -= BigInt(v) * this._q;
		else this.s(new Fraction(v));
		return this;
	}

	/** Multiplication in place */
	public m(v: Rational): this {
		if(v instanceof Fraction) { this._p *= v._p; this._q *= v._q; }
		else if(Number.isInteger(v)) this._p *= BigInt(v);
		else this.m(new Fraction(v));
		return this._check();
	}

	/** Division in place */
	public d(v: Rational): this {
		if(v instanceof Fraction) { this._p *= v._q; this._q *= v._p; }
		else if(Number.isInteger(v)) this._q *= BigInt(v);
		else this.d(new Fraction(v));
		return this._check();
	}

	private _check() {
		if(this._q < 0) { this._q = -this._q; this._p = -this._p; }
		return this;
	}

	/////////////////////////////////
	// Methods that creates new object
	/////////////////////////////////

	/** Negation to new instance */
	public get neg() { return this.c().n(); }

	/** Inversion to new instance */
	public get inv() { return this.c().i(); }

	/** Addition to new instance */
	public add(v: Rational) { return this.c().a(v); }

	/** Subtraction to new instance */
	public sub(v: Rational) { return this.c().s(v); }

	/** Multiplication to new instance */
	public mul(v: Rational) { return this.c().m(v); }

	/** Division to new instance */
	public div(v: Rational) { return this.c().d(v); }

	/////////////////////////////////
	// Compare methods
	/////////////////////////////////

	/**equal to */
	public eq(v: Rational) {
		if(v instanceof Fraction) return this._p * v._q == this._q * v._p;
		else return this._p == this._q * BigInt(v);
	}

	/**not equal to */
	public ne(v: Rational): boolean {
		if(v instanceof Fraction) return this._p * v._q != this._q * v._p;
		else if(Number.isSafeInteger(v)) return this._p != this._q * BigInt(v);
		else return this.ne(new Fraction(v));
	}

	/**less than */
	public lt(v: Rational): boolean {
		if(v instanceof Fraction) return this._p * v._q < this._q * v._p;
		else if(Number.isSafeInteger(v)) return this._p < this._q * BigInt(v);
		else return this.lt(new Fraction(v));
	}

	/**greater than */
	public gt(v: Rational): boolean {
		if(v instanceof Fraction) return this._p * v._q > this._q * v._p;
		else if(Number.isSafeInteger(v)) return this._p > this._q * BigInt(v);
		else return this.gt(new Fraction(v));
	}

	/**less than or equal to */
	public le(v: Rational): boolean {
		if(v instanceof Fraction) return this._p * v._q <= this._q * v._p;
		else if(Number.isSafeInteger(v)) return this._p <= this._q * BigInt(v);
		else return this.le(new Fraction(v));
	}

	/**greater than or equal to */
	public ge(v: Rational): boolean {
		if(v instanceof Fraction) return this._p * v._q >= this._q * v._p;
		else if(Number.isSafeInteger(v)) return this._p >= this._q * BigInt(v);
		else return this.ge(new Fraction(v));
	}

	public toJSON() {
		return this.toString();
	}
}
