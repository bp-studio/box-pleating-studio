import { Fraction } from "../fraction";
import { $reduce } from "../utils/gcd";
import { Couple } from "./couple";

import type { Pattern } from "core/design/layout/pattern/pattern";
import type { Rational } from "../fraction";

//=================================================================
/**
 * {@link Vector} represents a 2D vector.
 */
//=================================================================

export class Vector extends Couple {

	/** Returns a new instance of the zero-vector. */
	public static get ZERO(): Vector {
		return new Vector(0, 0);
	}

	/**Create a Vector object */
	constructor();
	constructor(c: Couple);
	constructor(p: IPoint);
	constructor(x: Rational, y: Rational);
	constructor(...p: [Couple | IPoint] | [Rational, Rational]) {
		if(p.length == 1) super(p[0].x, p[0].y);
		else super(...p);
	}

	/** Returns the floating length of the vector. */
	public get $length(): number {
		return Math.sqrt(this.dot(this));
	}

	/** Returns the slope in {@link Fraction}. */
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
	public $scale(r: Fraction): Vector;
	public $scale(c: Couple): Vector;
	public $scale(x: Fraction, y: Fraction): Vector;
	public $scale(x: Fraction | Couple, y?: Fraction): Vector {
		if(x instanceof Couple) return this.$scale(x._x, x._y);
		if(!y) y = x;
		return new Vector(this._x.mul(x), this._y.mul(y));
	}

	/** Calculates the dot product of vectors. */
	public dot(v: Vector): number {
		return this._x.mul(v._x).a(this._y.mul(v._y)).$value;
	}

	/** Take the negative value and returns a new vector. */
	public get neg(): Vector {
		return new Vector(this._x.neg, this._y.neg);
	}

	// eslint-disable-next-line local-rules/ascii-comments
	/** Returns the principal argument of the vector in radians. In the range of ±π/2. */
	public get $angle(): number {
		return Math.atan2(this.y, this.x);
	}

	/**
	 * Reduce the vector, and return a new vector of the same direction,
	 * but with denominators that are as small as possible.
	 */
	public reduce(): Vector {
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
		const { _x, _y } = this.reduce();
		return new Vector(_x.mul(_x).s(_y.mul(_y)), Fraction.TWO.mul(_x).m(_y));
	}

	/** Check if the given vector is parallel to this one. */
	public $parallel(v: Vector): boolean {
		return this._x.mul(v._y).eq(this._y.mul(v._x));
	}

	/**
	 * Calculate the angle bisector of two vectors.
	 *
	 * This algorithm assumes that the passed-in vectors
	 * are those axis-parallel vectors of GOPSs,
	 * so during the course of computation,
	 * z1 and z2 are guaranteed to be integers.
	 */
	public static $bisector(v1: Vector, v2: Vector): Vector {
		const [x1, y1] = $reduce(v1._x, v1._y);
		const [x2, y2] = $reduce(v2._x, v2._y);
		const z1 = Math.sqrt(x1 * x1 + y1 * y1);
		const z2 = Math.sqrt(x2 * x2 + y2 * y2);
		return new Vector(x1 * z2 + x2 * z1, y1 * z2 + y2 * z1);
	}
}
