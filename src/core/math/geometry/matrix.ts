import { Fraction } from "../fraction";

import type { Vector } from "./vector";
import type { Point } from "./point";

//=================================================================
/**
 * {@link Matrix} is a matrix of order 2 in with {@link Fraction}s.
 * It handles transformations of high precision.
 */
//=================================================================

export class Matrix {

	private a: Fraction; private b: Fraction;
	private c: Fraction; private d: Fraction;

	private readonly _det: Fraction;

	constructor(a: Fraction, b: Fraction, c: Fraction, d: Fraction, det?: Fraction) {
		this.a = a.c(); this.b = b.c();
		this.c = c.c(); this.d = d.c();
		if(det) this._det = det;
		else this._det = this.a.mul(this.d).s(this.b.mul(this.c));
	}

	public toString(): string { return [this.a, this.b, this.c, this.d].toString(); }

	/// #if DEBUG
	public toArray(): [number, number, number, number] {
		return [this.a.$value, this.b.$value, this.c.$value, this.d.$value];
	}
	/// #endif

	/**
	 * Returns the inverse matrix in a new instance.
	 * Returns `null` if the current matrix is not invertible.
	 */
	public get $inverse(): Matrix | null {
		if(this._det.eq(Fraction.ZERO)) return null;
		return new Matrix(
			this.d.div(this._det), this.b.neg.d(this._det),
			this.c.neg.d(this._det), this.a.div(this._det),
			this._det.inv
		);
	}

	/**
	 * Matrix multiplication with points or vectors.
	 *
	 * We have no use cases here for matrix multiplications with another matrix,
	 * so we don't implement it here for now.
	 */
	public $multiply(p: Point): Point;
	public $multiply(v: Vector): Vector;
	public $multiply(that: Point | Vector): typeof that {
		return new that.constructor(
			this.a.mul(that._x).a(this.b.mul(that._y)),
			this.c.mul(that._x).a(this.d.mul(that._y))
		);
	}

	/**
	 * Find the scaling-rotational matrix that transforms `from` to `to`.
	 * It is assumed that the parameters are non-zero vectors.
	 */
	public static $getTransformMatrix(from: Vector, to: Vector): Matrix {
		const M = new Matrix(from._x, from._y.neg, from._y, from._x);
		const { _x: a, _y: b } = M.$inverse!.$multiply(to);
		return new Matrix(a, b.neg, b, a);
	}
}
