import { expect } from "chai";

import { IntDoubleMap, MAX } from "shared/data/doubleMap/intDoubleMap";

export default function() {

	it("Defines toStringTag", function() {
		const map = new IntDoubleMap<number, string>();
		expect(String(map)).to.equal("[object IntDoubleMap(0)]");
	});

	it("Stores double number indices", function() {
		const map = new IntDoubleMap<number, string>();
		const value = "a";
		map.set(1, 2, value);
		expect(map.size).to.equal(1);
		expect([...map.keys()].length).to.equal(1);
		expect([...map.firstKeys()].length).to.equal(2);
		expect(map.has(1, 2)).to.be.true;
		expect(map.has(2, 1)).to.be.true;
		expect(map.get(2, 1)).to.equal(value);
		expect([...map]).to.deep.equal([[1, 2, "a"]]);

		let str = "";
		map.forEach((v, k1, k2) => str += v + k1 + k2);
		expect(str).to.equal("a12");

		map.set(2, 2, "b");
		expect(map.has(2)).to.be.true;
		map.set(2, 1, "c");
		map.set(2, 3, "d");

		expect([...map.keys()].length).to.equal(3);

		map.delete(2, 2);
		map.delete(1, 2);
		map.delete(3, 2);
		expect(map.has(1)).to.be.false;
		expect(map.size).to.equal(0);
	});

	it("Checks validity of indices", function() {
		const map = new IntDoubleMap<number, number>();
		expect(MAX).to.equal(65_535);
		expect(() => map.set(-1, 0, 0)).to.throw();
		expect(() => map.set(1.1, 0, 0)).to.throw();
		expect(() => map.set(MAX + 1, 0, 0)).to.throw();
		expect(map.size).to.equal(0);
		map.set(MAX, 0, 1);
		expect(map.get(0, MAX)).to.equal(1);
	});

	it("Can navigate on single index", function() {
		const map = new IntDoubleMap<number, string>();
		map.set(1, 2, "a");
		map.set(2, 3, "b");
		map.set(3, 4, "c");
		map.set(5, 5, "d");
		expect(map.size).to.equal(4);

		const sub = map.get(2)!;
		expect(sub).to.be.not.undefined;
		expect(sub.size).to.equal(2);
		expect(sub.get(1)).to.equal("a");
		expect(sub.get(3)).to.equal("b");

		map.delete(3);
		expect(map.has(4)).to.be.false;
		expect(map.size).to.equal(2);

		expect(map.get(5)!.size).to.equal(1);
		map.delete(5);
		expect(map.has(5)).to.be.false;
		expect(map.size).to.equal(1);
	});

}
