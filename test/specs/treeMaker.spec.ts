import { expect } from "chai";
import { readFileSync } from "fs";

import { treeMaker } from "client/plugins/treeMaker";

describe("TreeMaker importing", function() {
	let sample: string;

	before(function() {
		sample = readFileSync("./test/samples/sample.tmd5").toString();
	});

	it("Reads TreeMaker v5 format", function() {
		const result = treeMaker("Test", sample);
		expect(result.design.tree.nodes.length).to.equal(7);
	});

	it("Throws error on invalid format", function() {
		// Test complete nonsense
		expect(() => treeMaker("Test", "invalid content")).to.throw();

		// Test corrupted file
		expect(() => treeMaker("Test", sample.substring(0, 100))).to.throw();
	});
});
