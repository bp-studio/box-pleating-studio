import { expect } from "chai";

import { gcd, lcm } from "core/math/utils/gcd";
import { Fraction, toFraction } from "core/math/fraction";

describe("Mathematics", function() {

	describe("Fraction", function() {
		it("Approximates using continuous fraction", function() {
			const r = toFraction(Math.SQRT2, 0.01);
			expect(r.toJSON()).to.equal("17/12");
		});

		/** v0.6.17 */
		it("Does not get overly precise", function() {
			const f = new Fraction(-116293.66666666667);
			expect(f.$denominator).to.equal(3);
		});

		it("Throws error on invalid input", function() {
			expect(() => new Fraction(Number.POSITIVE_INFINITY)).to.throw();
		});
	});

	describe("GCD", function() {
		it("GCD(0, 0) is 1", function() {
			expect(gcd(0, 0)).to.equal(1);
		});

		it("Returns positive number", function() {
			expect(gcd(-12, 15)).to.equal(3);
		});
	});

	it("Computes LCM", function() {
		expect(lcm([12, 15] as Positive[])).to.equal(60);
	});
});
