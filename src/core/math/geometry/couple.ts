import { Fraction } from "../fraction";

import type { Rational } from "../fraction";
import type { Vector } from "./vector";

//=================================================================
/**
 * Although 2D points and 2D vectors are similar object,
 * they have completely different meanings in geometry,
 * so we defined them as two different classes,
 * both inherit from this {@link Couple} class.
 *
 * All derived classes of `Couple` are immutable by design,
 * and all operations on them creates new instances.
 */
//=================================================================

export abstract class Couple {

	public _x: Fraction;
	public _y: Fraction;

	/** Create a Couple object */
	constructor(x: Rational, y: Rational) {
		this._x = new Fraction(x);
		this._y = new Fraction(y);
	}

	public get x(): number { return this._x.$value; }
	public get y(): number { return this._y.$value; }

	// Specify `c` as type `this` will block all calling of this method
	// between different derived classes, which is the desired behavior
	public eq(c?: this | null): boolean {
		if(!c) return false;
		return this._x.eq(c._x) && this._y.eq(c._y);
	}

	/** Print out the Couple in the "(x, y)" format */
	public toString(): string { return "(" + this._x + ", " + this._y + ")"; }

	public $add(v: Vector): this {
		return new this.constructor(this._x.add(v._x), this._y.add(v._y));
	}

	/** Convert self into an {@link IPoint}. */
	public $toIPoint(): IPoint {
		return { x: this.x, y: this.y };
	}
}

// This helps TypeScript recognize the type of the current constructor
export interface Couple {
	constructor: new (x: Fraction, y: Fraction) => this;
}
