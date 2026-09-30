import { describe, it, expect, beforeAll } from "@rstest/core";

import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";
import { options } from "client/options";
import { MAX_SHEET_SIZE } from "shared/types/constants";

import type { JProject } from "shared/json";

describe("Migration", () => {

	describe("Versioning", () => {
		it("Treats unversioned file as version 0", () => {
			expect(Migration.$getVersionIndex({})).to.equal(0);
		});

		it("Throws error on unknown version", () => {
			expect(() => Migration.$getVersionIndex({ version: "~~~" })).to.throw();
		});
	});

	describe("v0.6", () => {

		let result: JProject;

		beforeAll(async () => {
			const sample = await getJSON("v04.session.sample.json");
			result = Migration.$process(sample);
		});

		it("Isolates design", () => {
			expect(result).to.have.property("design");
			expect(result.design).to.have.all.keys("title", "description", "mode", "layout", "tree");
			expect(result).to.not.have.any.keys("title", "description", "mode", "layout", "tree");
		});

		it("Moves history to the top-level", () => {
			expect(result).to.have.property("history");
			expect(result.design).to.not.have.property("history");
		});

		it("Moves state to the top-level", () => {
			expect(result).to.have.property("state");
			expect(result.state).to.have.all.keys("layout");
			expect(result.state?.layout).to.have.all.keys("zoom", "scroll");
			expect(result.design.layout).to.not.have.any.keys("zoom", "scroll");
		});
	});

	describe("Checks", () => {

		it("Imposes sheet limit", async () => {
			let deprecated = false;
			options.onDeprecate = () => deprecated = true;
			const sample = await getJSON("v07.troll.sample.json");
			const result = Migration.$process(sample);
			expect(result.design.layout.sheet.width).to.equal(MAX_SHEET_SIZE);
			expect(deprecated).to.be.true;
			delete options.onDeprecate;
		});

	});

});
