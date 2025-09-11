import { expect } from "chai";

import { parseLine } from "@utils/line";
import { Line } from "core/math/geometry/line";
import { Vector } from "core/math/geometry/vector";

export default function() {

	it("Checks equality", function() {
		expect(parseLine("(0,0)-(5,0)").eq(parseLine("(5,0)-(0,0)"))).to.be.true;
		expect(parseLine("(0,0)-(5,0)").eq(parseLine("(0,0)-(5,0)"))).to.be.true;
	});

	it("Lists grid points", function() {
		expect(parseLine("(4,10)-(0.0)").$gridPoints().length).to.equal(3);
		expect(parseLine("(10,4)-(0.0)").$gridPoints().length).to.equal(3);
	});

	it("Checks perpendicularity", function() {
		expect(parseLine("(0,0)-(2,4)").$perpendicular(new Vector(2, -1))).to.be.true;
	});

	describe("Subtraction", function() {
		function testSubtract(l1: string, l2: string) {
			return Line.$subtract([parseLine(l1)], [parseLine(l2)]);
		}

		it("Returns remaining parts after subtraction", function() {
			expect(testSubtract("(0,0)-(5,0)", "(2,0)-(3,0)").length).to.equal(2);
			expect(testSubtract("(5,0)-(0,0)", "(2,0)-(3,0)").length).to.equal(2);
			expect(testSubtract("(0,0)-(5,0)", "(-1,0)-(6,0)").length).to.equal(0);
			expect(testSubtract("(0,0)-(5,0)", "(4,0)-(6,0)").length).to.equal(1);
			expect(testSubtract("(0,0)-(5,0)", "(-1,0)-(1,0)").length).to.equal(1);
		});

		it("Ignores degenerated parts", function() {
			expect(testSubtract("(0,0)-(5,0)", "(0,0)-(3,0)").length).to.equal(1);
			expect(testSubtract("(5,0)-(0,0)", "(0,0)-(3,0)").length).to.equal(1);
			expect(testSubtract("(0,0)-(5,0)", "(2,0)-(5,0)").length).to.equal(1);
			expect(testSubtract("(5,0)-(0,0)", "(2,0)-(5,0)").length).to.equal(1);
		});
	});

}
