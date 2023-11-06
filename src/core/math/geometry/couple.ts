import { Fraction } from "../fraction";
import { isAlmostInteger } from "./float";

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
	public set x(v: number) { this._x = new Fraction(v); }
	public get y(): number { return this._y.$value; }
	public set y(v: number) { this._y = new Fraction(v); }

	// Specify `c` as type `this` will block all calling of this method
	// between different derived classes, which is the desired behavior
	public eq(c?: this | null): boolean {
		if(!c) return false;
		return this._x.eq(c._x) && this._y.eq(c._y);
	}

	public $clone(): this {
		return new this.constructor(this._x, this._y);
	}

	/** Print out the Couple in the "(x, y)" format */
	public toString(): string { return "(" + this._x + ", " + this._y + ")"; }

	public toJSON(): string {
		return this.toString();
	}

	public set(c: this): this;
	public set(x: Rational, y: Rational): this;
	public set(x: Rational | this, y: Rational = 0): this {
		if(x instanceof Couple) {
			this._x = x._x.c();
			this._y = x._y.c();
		} else {
			this._x = new Fraction(x);
			this._y = new Fraction(y);
		}
		return this;
	}

	public $add(v: Vector): this {
		return new this.constructor(this._x.add(v._x), this._y.add(v._y));
	}

	public addBy(v: Vector): this {
		this._x.a(v._x); this._y.a(v._y);
		return this;
	}

	/** Restrict the Couple to a certain rectangular range */
	public $range(min_X: Fraction, max_X: Fraction, min_Y: Fraction, max_Y: Fraction): this {
		if(this._x.lt(min_X)) this._x = min_X;
		if(this._x.gt(max_X)) this._x = max_X;
		if(this._y.lt(min_Y)) this._y = min_Y;
		if(this._y.gt(max_Y)) this._y = max_Y;
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
