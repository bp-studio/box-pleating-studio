import { distinct, isTypedArray } from "shared/utils/array";

export default function() {
	it("Removes duplicated elements", function() {
		expect(distinct([1, 2, 2, 3, 4, 4, 5])).to.eql([1, 2, 3, 4, 5]);
	});

	it("Determines typed array", function() {
		expect(isTypedArray([new Set(), new Set()], Set)).to.be.true;
		expect(isTypedArray([new Set(), new Map()], Set)).to.be.false;
	});
}
