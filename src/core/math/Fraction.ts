import { $reduceInt } from "./util/GCD";
import type { Sign } from "./types";

/** floor(sqrt(max_safe_integer / 2)) */
const MAX_SAFE = 67108863;

export type Rational = number | Fraction;

//////////////////////////////////////////////////////////////////
/**
 * 代表一個有理分數。
 *
 * 原本這個類別內部採用 BigInt 型態來確保無窮精度的分數，
 * 並且在各種運算之上有參數多載以求靈活，
 * 不過後來由於證實 BigInt 的運算速度較慢，
 * 而且多載也會產生多餘的判別成本，
 * 所以在此版本之中徹底把此類別重新改回使用一般的數值來內存，
 * 且去掉了所有的多載、一切的運算都只能也跟分數來進行。
 */
//////////////////////////////////////////////////////////////////

export class Fraction {

	public static readonly ZERO = new Fraction(0);
	public static readonly ONE = new Fraction(1);
	public static readonly TWO = new Fraction(2);

	/** 分子，可正可負 */
	private _p: number;

	/** 分母，恆正 */
	private _q: number;

	constructor(value: Rational);
	constructor(numerator: number, denominator: number);
	constructor(n: Rational, d: number = 1) {
		if(n instanceof Fraction) {
			this._p = n._p;
			this._q = n._q * d;
			this._check();
		} else if(typeof n == 'number' && typeof d == 'number') {
			if(Number.isSafeInteger(n) && Number.isSafeInteger(d)) {
				this._p = n;
				this._q = d;
				this._check();
			} else if(!Number.isFinite(n / d)) {
				debugger;
				throw new Error("Parameters are not valid");
			} else if(Number.isSafeInteger(Math.floor(n / d))) {
				// eslint-disable-next-line no-constructor-return
				return Fraction.$toFraction(n / d);
			} else {
				// 最後的 fallback，使用不精確模式
				this._p = n;
				this._q = d;
			}
		} else {
			debugger;
			throw new Error("Parameters are not valid");
		}
	}

	public static $toFraction(v: number, k2 = 1, k1 = 0, err = Fraction.$ERROR): Fraction {
		let n = Math.floor(v), r = v - n, k0 = n * k1 + k2;
		let f = new Fraction(n);
		if(r / k0 / ((1 - r) * k0 + k1) < err) return f;
		else return Fraction.$toFraction(1 / r, k1, k0).i().a(f);
	}

	/** 把浮點數轉換成有理數時的可允許誤差範圍 */
	private static readonly $ERROR = 1e-12;

	public get $numerator(): number { return this._p; }
	public get $denominator(): number { return this._q; }

	/////////////////////////////////
	// Core members
	/////////////////////////////////

	/** The value of the fraction as number */
	public get $value(): number {
		return this._p / this._q;
	}

	/** Output the fraction in the format of `p/q` (in lowest terms), or just `p` if `q` equals 1. */
	public toString(): string {
		this._smp();
		return this._p + (this._q > 1 ? "/" + this._q : "");
	}

	/** Clone */
	public c(): Fraction {
		return new Fraction(this._p, this._q);
	}

	/////////////////////////////////
	// Single operation methods
	/////////////////////////////////

	/** Simplification in place */
	private _smp(): void {
		[this._p, this._q] = $reduceInt(this._p, this._q);
	}

	/** Negation in place */
	public n(): this {
		this._p = -this._p;
		return this;
	}

	/** Inversion in place */
	public i(): this {
		[this._p, this._q] = [this._q, this._p];
		return this._check();
	}

	/** Round to the nearest integer in place */
	public r(): this {
		this._p = Math.round(this.$value);
		this._q = 1;
		return this;
	}

	/////////////////////////////////
	// Arithmetic methods
	/////////////////////////////////

	/** Addition in place */
	public a(f: Fraction): this {
		this._p = this._p * f._q + this._q * f._p;
		this._q *= f._q;
		return this._check();
	}

	/** Subtraction in place */
	public s(f: Fraction): this {
		this._p = this._p * f._q - this._q * f._p;
		this._q *= f._q;
		return this._check();
	}

	/** Multiplication in place */
	public m(f: Fraction): this {
		this._p *= f._p;
		this._q *= f._q;
		return this._check();
	}

	/** Division in place */
	public d(f: Fraction): this {
		// Division by zero is not prohibited here,
		// as it is possible to have a slope that is infinity.
		this._p *= f._q;
		this._q *= f._p;
		return this._check();
	}

	public f(f: Sign): this {
		this._p *= f;
		return this;
	}

	public get isIntegral(): boolean {
		this._smp();
		return this._q == 1;
	}

	/** Normalization after each operation */
	private _check(): this {
		// Try auto simplifying.
		if(this.$isDangerous) this._smp();

		// Make sure that q is always positive.
		if(this._q < 0) {
			this._q = -this._q;
			this._p = -this._p;
		} else if(this._q == 0) {
			// Infinity occurs only in slope calculation,
			// and we don't need to distinguish the sign.
			this._p = 1;
		}

		return this;
	}

	/**
	 * Test if the numbers are greater than MAX_SAFE.
	 * If one of them are greater, then one more operation could lead to overflow,
	 * and we call that "dangerous".
	 */
	public get $isDangerous(): boolean {
		return Math.abs(this._p) > MAX_SAFE || Math.abs(this._q) > MAX_SAFE;
	}

	/////////////////////////////////
	// Methods that creates new object
	/////////////////////////////////

	/** Negation to new instance */
	public get neg(): Fraction { return this.c().n(); }

	/** Inversion to new instance */
	public get inv(): Fraction { return this.c().i(); }

	/** Addition to new instance */
	public add(v: Fraction): Fraction { return this.c().a(v); }

	/** Subtraction to new instance */
	public sub(v: Fraction): Fraction { return this.c().s(v); }

	/** Multiplication to new instance */
	public mul(v: Fraction): Fraction { return this.c().m(v); }

	/** Apply factor to new instance */
	public fac(f: Sign): Fraction { return this.c().f(f); }

	/** Division to new instance */
	public div(v: Fraction): Fraction { return this.c().d(v); }

	/////////////////////////////////
	// Compare methods
	/////////////////////////////////

	/**equal to */
	public eq(v: Fraction): boolean {
		return this._p * v._q == this._q * v._p;
	}

	/**less than */
	public lt(v: Fraction): boolean {
		return this._p * v._q < this._q * v._p;
	}

	/**greater than */
	public gt(v: Fraction): boolean {
		return this._p * v._q > this._q * v._p;
	}

	/**less than or equal to */
	public le(v: Fraction): boolean {
		return this._p * v._q <= this._q * v._p;
	}

	/**greater than or equal to */
	public ge(v: Fraction): boolean {
		return this._p * v._q >= this._q * v._p;
	}

	/////////////////////////////////
	// Other methods
	/////////////////////////////////

	public $reduceWith(f: Fraction): [Fraction, Fraction] {
		this._smp(); f._smp();
		let [n1, n2] = $reduceInt(this._p, f._p);
		let [d1, d2] = $reduceInt(this._q, f._q);
		return [new Fraction(n1, d1), new Fraction(n2, d2)];
	}

	public $reduceToIntWith(f: Fraction): [Fraction, Fraction] {
		this._smp(); f._smp();
		let [n1, n2] = $reduceInt(this._p * f._q, this._q * f._p);
		return [new Fraction(n1), new Fraction(n2)];
	}

	public toJSON(): string {
		return this.toString();
	}
}
