import { Fraction } from "../fraction";
import { Couple } from "./couple";

import type { Pattern } from "core/design/layout/pattern/pattern";
import type { Rational } from "../fraction";

//=================================================================
/**
 * {@link Vector} represents a 2D vector.
 */
//=================================================================

export class Vector extends Couple {

	/** The zero-vector. */
	public static readonly ZERO = new Vector(0, 0);

	/**Create a Vector object */
	constructor();
	constructor(p: IPoint);
	constructor(x: Rational, y: Rational);
	constructor(...p: [IPoint] | [Rational, Rational]) {
		if(p.length == 1) super(p[0].x, p[0].y);
		else super(...p);
	}

	/** Returns the floating length of the vector. */
	public get $length(): number {
		return Math.sqrt(this.$dot(this));
	}

	/**
	 * Returns the slope in a non-zero {@link Fraction}.
	 *
	 * Must ensure that the current vector is NOT axis-parallel.
	 */
	public get $slope(): Fraction {
		return this._y.div(this._x);
	}

	/** Rotate the vector 90-degrees in counter-clockwise direction. */
	public $rotate90(): Vector {
		return new Vector(this._y.neg, this._x);
	}

	/**
	 * Return a vector of length 1 and of the same direction.
	 *
	 * It assumes that the current vector is an axis-parallel vector,
	 * so that current length is in fact rational.
	 */
	public $normalize(): Vector {
		return this.$scale(new Fraction(this.$length).inv);
	}

	/** Scale and returns a new vector. */
	public $scale(r: Fraction): Vector {
		return new Vector(this._x.mul(r), this._y.mul(r));
	}

	/** Calculates the dot product of vectors. */
	public $dot(v: Vector): number {
		return this._x.mul(v._x).a(this._y.mul(v._y)).$value;
	}

	/** Take the negative value and returns a new vector. */
	public get $neg(): Vector {
		return new Vector(this._x.neg, this._y.neg);
	}

	/** Returns the principal argument of the vector in radians, in the range of (-PI/2, PI/2). */
	public get $angle(): number {
		return Math.atan2(this.y, this.x);
	}

	/**
	 * Reduce the vector, and return a new vector of the same direction,
	 * but with denominators that are as small as possible.
	 */
	public $reduce(): Vector {
		return new Vector(...this._x.$reduceWith(this._y));
	}

	/**
	 * Reduce the vector, and return a new vector of the same direction,
	 * but with integral components.
	 *
	 * The main use case for this method is to normalize the vectors
	 * for testing equalities of {@link Pattern}s.
	 *
	 * Depending on the denominators of the original vector,
	 * the new vector could be way longer than the original one.
	 */
	public $reduceToInt(): Vector {
		return new Vector(...this._x.$reduceToIntWith(this._y));
	}

	/**
	 * Double the principle argument and returns the new vector.
	 *
	 * Note that the length of the new vector may be different from the original length.
	 */
	public $doubleAngle(): Vector {
		const { _x, _y } = this.$reduce();
		return new Vector(_x.mul(_x).s(_y.mul(_y)), Fraction.TWO.mul(_x).m(_y));
	}

	/** Check if the given vector is parallel to this one. */
	public $parallel(v: Vector): boolean {
		return this._x.mul(v._y).eq(this._y.mul(v._x));
	}
}
