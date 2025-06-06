import { expect } from "chai";

import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";
import { MAX_SHEET_SIZE } from "shared/types/constants";

import type { JProject } from "shared/json";

describe("Migration", function() {

	describe("Versioning", function() {
		it("Treats unversioned file as version 0", function() {
			expect(Migration.$getVersionIndex({})).to.equal(0);
		});

		it("Throws error on unknown version", function() {
			expect(() => Migration.$getVersionIndex({ version: "~~~" })).to.throw();
		});
	});

	describe("v0.6", function() {

		let result: JProject;

		before(async function() {
			const sample = await getJSON("v04.session.sample.json");
			result = Migration.$process(sample);
		});

		it("Isolates design", function() {
			expect(result).to.have.property("design");
			expect(result.design).to.have.all.keys("title", "description", "mode", "layout", "tree");
			expect(result).to.not.have.any.keys("title", "description", "mode", "layout", "tree");
		});

		it("Moves history to the top-level", function() {
			expect(result).to.have.property("history");
			expect(result.design).to.not.have.property("history");
		});

		it("Moves state to the top-level", function() {
			expect(result).to.have.property("state");
			expect(result.state).to.have.all.keys("layout");
			expect(result.state?.layout).to.have.all.keys("zoom", "scroll");
			expect(result.design.layout).to.not.have.any.keys("zoom", "scroll");
		});
	});

	describe("v0.7", function() {

		let result: JProject;

		before(async function() {
			const sample = await getJSON("v06.troll.sample.json");
			result = Migration.$process(sample);
		});

		it("Imposes sheet limit", function() {
			expect(result.design.layout.sheet.width).to.equal(MAX_SHEET_SIZE);
		});

	});

});
