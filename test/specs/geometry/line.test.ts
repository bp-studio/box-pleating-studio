import { describe, it, expect } from "@rstest/core";

import { parseLine } from "@utils/line";
import { Line } from "core/math/geometry/line";
import { Vector } from "core/math/geometry/vector";

export default function() {

	it("Checks equality", () => {
		expect(parseLine("(0,0)-(5,0)").eq(parseLine("(5,0)-(0,0)"))).to.be.true;
		expect(parseLine("(0,0)-(5,0)").eq(parseLine("(0,0)-(5,0)"))).to.be.true;
	});

	it("Lists grid points", () => {
		expect(parseLine("(4,10)-(0.0)").$gridPoints().length).to.equal(3);
		expect(parseLine("(10,4)-(0.0)").$gridPoints().length).to.equal(3);
	});

	it("Checks perpendicularity", () => {
		expect(parseLine("(0,0)-(2,4)").$perpendicular(new Vector(2, -1))).to.be.true;
	});

	it("Reflects about a given direction", () => {
		// This particular example overflows for v0.7.11 and below.
		const l = parseLine("(-21, 131)-(144031/3031, 374438/3031)");
		const result = l.$reflect(new Vector(2508, 3995)).toString();
		expect(result).to.equal("(-3116880, 8711609)");
	});

	describe("Subtraction", () => {
		function testSubtract(l1: string, l2: string) {
			return Line.$subtract([parseLine(l1)], [parseLine(l2)]);
		}

		it("Returns remaining parts after subtraction", () => {
			expect(testSubtract("(0,0)-(5,0)", "(2,0)-(3,0)").length).to.equal(2);
			expect(testSubtract("(5,0)-(0,0)", "(2,0)-(3,0)").length).to.equal(2);
			expect(testSubtract("(0,0)-(5,0)", "(-1,0)-(6,0)").length).to.equal(0);
			expect(testSubtract("(0,0)-(5,0)", "(4,0)-(6,0)").length).to.equal(1);
			expect(testSubtract("(0,0)-(5,0)", "(-1,0)-(1,0)").length).to.equal(1);
		});

		it("Ignores degenerated parts", () => {
			expect(testSubtract("(0,0)-(5,0)", "(0,0)-(3,0)").length).to.equal(1);
			expect(testSubtract("(5,0)-(0,0)", "(0,0)-(3,0)").length).to.equal(1);
			expect(testSubtract("(0,0)-(5,0)", "(2,0)-(5,0)").length).to.equal(1);
			expect(testSubtract("(5,0)-(0,0)", "(2,0)-(5,0)").length).to.equal(1);
		});
	});

}
