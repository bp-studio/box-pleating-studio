import { describe, it, expect, beforeAll } from "@rstest/core";

import { getText } from "@utils/sample";
import { treeMaker } from "client/plugins/treeMaker";

describe("TreeMaker importing", () => {
	let sample: string;

	beforeAll(async () => {
		sample = await getText("sample.tmd5");
	});

	it("Reads TreeMaker v5 format", () => {
		const result = treeMaker("Test", sample);
		expect(result.design.tree.nodes.length).to.equal(7);
	});

	it("Throws error on invalid format", () => {
		// Test complete nonsense
		expect(() => treeMaker("Test", "invalid content")).to.throw();

		// Test corrupted file
		expect(() => treeMaker("Test", sample.substring(0, 100))).to.throw();
	});
});
