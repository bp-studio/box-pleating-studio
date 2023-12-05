import { Fraction } from "../fraction";

import type { Rational } from "../fraction";
import type { Vector } from "./vector";

//=================================================================
/**
 * Although 2D points and 2D vectors are similar object,
 * they have completely different meanings in geometry,
 * so we defined them as two different classes,
 * both inherit from this {@link Couple} class.
 */
//=================================================================

export abstract class Couple {

	public _x: Fraction;
	public _y: Fraction;

	/** Create a Couple object */
	constructor(c: Couple);
	constructor(x: Rational, y: Rational);
	constructor(...p: [Couple] | [Rational, Rational]) {
		if(p.length == 1) p = [p[0]._x, p[0]._y];
		this._x = new Fraction(p[0]);
		this._y = new Fraction(p[1]);
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

	public addBy(v: Vector): this {
		this._x.a(v._x); this._y.a(v._y);
		return this;
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
