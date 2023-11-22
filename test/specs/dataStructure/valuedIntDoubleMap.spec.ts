import { expect } from "chai";

import { ValuedIntDoubleMap } from "shared/data/doubleMap/valuedIntDoubleMap";

describe("Valued Int Double Map", function() {

	it("Can lookup values", function() {
		const map = new ValuedIntDoubleMap<number, string>();
		const value = "a", other = "other";
		map.set(1, 2, value);
		map.set(2, 3, value);
		map.set(1, 3, other);

		expect(map.$hasValue(value)).to.be.true;
		expect(map.$hasValue(other)).to.be.true;
		expect(map.$hasValue("test")).to.be.false;
		expect([...map.$getValueKeys(value)].length).to.equal(2);

		map.set(2, 3, other);
		expect([...map.$getValueKeys(value)].length).to.equal(1);
		expect([...map.$getValueKeys(other)].length).to.equal(2);
	});

	it("Can delete by value", function() {
		const map = new ValuedIntDoubleMap<number, string>();
		const value = "a";
		map.set(1, 2, value);
		map.set(2, 3, value);
		map.set(1, 3, "else");

		expect(map.size).to.equal(3);
		map.$deleteValue(value);
		expect(map.$hasValue(value)).to.be.false;
		expect(map.size).to.equal(1);

		const keys = [...map.$getValueKeys(value)];
		expect(keys.length).to.equal(0);
	});

});
