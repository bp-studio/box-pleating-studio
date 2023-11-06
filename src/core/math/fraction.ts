import { InvalidParameterError } from "./invalidParameterError";
import { $reduceInt } from "./utils/gcd";

/** floor(sqrt(max_safe_integer / 2)) */
const MAX_SAFE = 67108863;

/** Allowed error for converting a floating number to a fraction. */
const ERROR = 1e-12;

/** Using continuous fractions to obtain a rational approximation of any floating number. */
export function toFraction(v: number, err: number): Fraction {
	return toFractionRecursive(v, 1, 0, err);
}

export function toFractionRecursive(v: number, k2: number, k1: number, err: number): Fraction {
	const n = Math.floor(v), r = v - n, k0 = n * k1 + k2;
	const f = new Fraction(n);
	if(r / k0 / ((1 - r) * k0 + k1) < err) return f;
	else return toFractionRecursive(1 / r, k1, k0, err).i().a(f);
}

export type Rational = number | Fraction;

//=================================================================
/**
 * {@link Fraction} represents a rational number.
 *
 * Originally, this class used the {@link BigInt} type internally for infinite precision,
 * and had overloaded parameters for various operations for flexibility.
 * However, later it was found that BigInt's arithmetic speed is way too slow,
 * and overloading also incurred unnecessary overheads, so in this version,
 * this class was completely re-implemented to use the primitive number type,
 * and all overloading was removed,
 * so that all operations can only be performed with rational numbers.
 */
//=================================================================

export class Fraction {

	public static readonly ZERO = new Fraction(0);
	public static readonly ONE = new Fraction(1);
	public static readonly TWO = new Fraction(2);

	/** Numerator, could be negative. */
	private _p: number;

	/** Denominator, always {@link Positive}. */
	private _q: Positive;

	constructor(value: Rational);
	constructor(numerator: number, denominator: Positive);
	constructor(n: Rational, d: Positive = 1) {
		if(n instanceof Fraction) {
			this._p = n._p;
			this._q = n._q * d as Positive;
		} else if(typeof n == "number" && typeof d == "number") {
			if(Number.isSafeInteger(n) && Number.isSafeInteger(d)) {
				this._p = n;
				this._q = d;
			} else if(Number.isSafeInteger(Math.floor(n / d))) {
				const result = toFraction(n / d, ERROR);
				this._p = result._p;
				this._q = result._q;
			} else {
				throw new InvalidParameterError();
			}
		} else {
			throw new InvalidParameterError();
		}
		this._normalize();
	}

	public get $numerator(): number { return this._p; }
	public get $denominator(): Positive { return this._q; }

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Core members
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** The value of the fraction as number */
	public get $value(): number {
		return this._p / this._q;
	}

	/** Output the fraction in the format of `p/q` (in lowest terms), or just `p` if `q` equals 1. */
	public toString(): string {
		// Uncomment the next line for easier debugging
		// return this.$value.toString();
		this._smp();
		return this._p + (this._q > 1 ? "/" + this._q : "");
	}

	/** Clone */
	public c(): Fraction {
		return new Fraction(this._p, this._q);
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Single operation methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

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
		const sgn = Math.sign(this._p);
		[this._p, this._q] = [sgn * this._q, sgn * this._p as Positive];
		return this;
	}

	/** Round to the nearest integer in place */
	public r(): this {
		this._p = Math.round(this.$value);
		this._q = 1;
		return this;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Arithmetic methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Addition in place */
	public a(f: Fraction): this {
		this._p = this._p * f._q + this._q * f._p;
		this._q *= f._q;
		return this._normalize();
	}

	/** Subtraction in place */
	public s(f: Fraction): this {
		this._p = this._p * f._q - this._q * f._p;
		this._q *= f._q;
		return this._normalize();
	}

	/** Multiplication in place */
	public m(f: Fraction): this {
		this._p *= f._p;
		this._q *= f._q;
		return this._normalize();
	}

	/**
	 * Division in place.
	 * Must ensure that {@link f} is non-zero.
	 */
	public d(f: Fraction): this {
		const sgn = Math.sign(f._p);
		this._p *= sgn * f._q;
		this._q *= sgn * f._p;
		return this._normalize();
	}

	/** Change the sign of the fraction. */
	public f(f: Sign): this {
		this._p *= f;
		return this;
	}

	/** Whether this fraction is actually an integer. */
	public get isIntegral(): boolean {
		this._smp();
		return this._q == 1;
	}

	/** Normalization after each operation */
	private _normalize(): this {
		// Test if the numbers are greater than MAX_SAFE.
		// If one of them are greater, then one more operation could lead to overflow.
		if(this._q > MAX_SAFE || Math.abs(this._p) > MAX_SAFE) this._smp();
		return this;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Methods that creates new object
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Negation to new instance */
	public get neg(): Fraction { return this.c().n(); }

	/**
	 * Inversion to new instance.
	 * Must ensure that self is non-zero first.
	 */
	public get inv(): Fraction { return this.c().i(); }

	/** Addition to new instance */
	public add(v: Fraction): Fraction { return this.c().a(v); }

	/** Subtraction to new instance */
	public sub(v: Fraction): Fraction { return this.c().s(v); }

	/** Multiplication to new instance */
	public mul(v: Fraction): Fraction { return this.c().m(v); }

	/** Apply factor to new instance */
	public fac(f: Sign): Fraction { return this.c().f(f); }

	/**
	 * Division to new instance.
	 * Must ensure that {@link v} is non-zero.
	 */
	public div(v: Fraction): Fraction { return this.c().d(v); }


	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Compare methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Equal to */
	public eq(v: Fraction): boolean {
		return this._p * v._q == this._q * v._p;
	}

	/** Less than */
	public lt(v: Fraction): boolean {
		return this._p * v._q < this._q * v._p;
	}

	/** Greater than */
	public gt(v: Fraction): boolean {
		return this._p * v._q > this._q * v._p;
	}

	/** Less than or equal to */
	public le(v: Fraction): boolean {
		return this._p * v._q <= this._q * v._p;
	}

	/** Greater than or equal to */
	public ge(v: Fraction): boolean {
		return this._p * v._q >= this._q * v._p;
	}

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Other methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	public $reduceWith(f: Fraction): [Fraction, Fraction] {
		this._smp(); f._smp();
		const [n1, n2] = $reduceInt(this._p, f._p);
		const [d1, d2] = $reduceInt(this._q, f._q);
		return [new Fraction(n1, d1), new Fraction(n2, d2)];
	}

	public $reduceToIntWith(f: Fraction): [Fraction, Fraction] {
		this._smp(); f._smp();
		const [n1, n2] = $reduceInt(this._p * f._q, this._q * f._p);
		return [new Fraction(n1), new Fraction(n2)];
	}

	public toJSON(): string {
		return this.toString();
	}
}
