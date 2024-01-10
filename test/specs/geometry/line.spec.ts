import { Line } from "core/math/geometry/line";
import { parseLine } from "../../utils/line";

export default function() {

	it("Checks equality", function() {
		expect(parseLine("(0,0)-(5,0)").eq(parseLine("(5,0)-(0,0)"))).to.be.true;
	});

	it("List grid points", function() {
		const result = [...parseLine("(6,3)-(0.0)").$gridPoints()];
		expect(result.length).to.equal(4);
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
