import { Migration } from "client/patches";
import * as sample from "../samples/v04.session.sample.json";

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

		before(function() { return result = Migration.$process(sample); });

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

});
