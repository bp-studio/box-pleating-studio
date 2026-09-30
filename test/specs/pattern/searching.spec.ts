import { describe, it, expect } from "@rstest/core";

import { LayoutController } from "core/controller/layoutController";
import { id2, id3, id4, id5, parseTree } from "@utils/tree";
import { UpdateResult } from "core/service/updateResult";
import { State, fullReset } from "core/service/state";
import { complete, generateFromFlaps } from "./util";
import { DesignController } from "core/controller/designController";
import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";

import type { JEdge, JFlap } from "shared/json";

describe("Searching", () => {

	it("Loads saved patterns", async () => {
		fullReset();
		const sample = await getJSON("v04.session.sample.json");
		const data = Migration.$process(sample);
		DesignController.init(data.design);
		complete();
		const stretch = State.$stretches.get("12,27")!;
		const device = stretch.$repo.$pattern!.$devices[0];
		expect(device.$offset).to.equal(4);
	});

	/** Added v0.7.17 */
	it("Recognizes the saved pattern when searching", () => {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		complete();
		const count = State.$stretches.get("1,2")!.$repo.$configuration!.$length;
		expect(count).to.equal(2);

		// Save the stretch as in a project file, that is, without the repo
		const { id, configuration, pattern } = State.$stretches.get("1,2")!.toJSON();
		const project = Migration.$getSample();
		project.design.tree.edges = [{ n1: 0, n2: 1, length: 7 }, { n1: 0, n2: 2, length: 4 }] as JEdge[];
		project.design.layout.flaps = [
			{ id: 1, x: 0, y: 0, width: 0, height: 0 },
			{ id: 2, x: 8, y: 9, width: 0, height: 0 },
		] as JFlap[];
		project.design.layout.stretches = [{ id, configuration, pattern }];

		// The saved pattern should be recognized among the searched ones, instead of being counted twice
		fullReset();
		DesignController.init(project.design);
		complete();
		const repo = State.$stretches.get("1,2")!.$repo;
		expect(repo.$configurations.length).to.equal(1);
		expect(repo.$configuration!.$length).to.equal(count);
	});

	/** Added v0.7.17 */
	it("Serializes patterns without caches", () => {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		complete();
		UpdateResult.$flush(); // Make sure that the devices are rendered, so that the caches are filled
		const json = JSON.stringify(State.$stretches.get("1,2")!.toJSON());
		expect(json).to.not.match(/"[$_]\w*":/);
	});

	/** Added v0.8.0 */
	it("Recovers the entire repo from session", () => {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		complete();
		LayoutController.completeStretch("1,2");
		LayoutController.switchPattern("1,2", 1);

		// Save the stretch as in a session, that is, with the entire repo
		const json = State.$stretches.get("1,2")!.toJSON();
		expect(json.repo).to.not.be.undefined;
		const project = Migration.$getSample();
		project.design.tree.edges = [{ n1: 0, n2: 1, length: 7 }, { n1: 0, n2: 2, length: 4 }] as JEdge[];
		project.design.layout.flaps = [
			{ id: 1, x: 0, y: 0, width: 0, height: 0 },
			{ id: 2, x: 8, y: 9, width: 0, height: 0 },
		] as JFlap[];
		project.design.layout.stretches = [json];

		fullReset();
		DesignController.init(project.design);
		complete();
		const repo = State.$stretches.get("1,2")!.$repo;
		expect(repo.$configurations.length).to.equal(1);
		const config = repo.$configuration!;
		expect(config.$length).to.equal(2);
		// Only the recovered repo remembers the chosen pattern;
		// recovering from the single saved pattern would put it at index 0 instead.
		expect(config.$index).to.equal(1);
	});

	/**
	 * The rule: the notification is shown if and only if there is a stretch without pattern
	 * such that the flaps involved do not form any invalid junctions among themselves.
	 */
	describe("Pattern-not-found notification", () => {

		it("Signifies when no pattern is found", () => {
			parseTree("(2,0,10),(2,1,2),(2,3,3)", "(0,0,0,0,0),(1,11,5,0,0),(3,9,10,0,0)");
			const stretch = State.$stretches.get("0,1,3")!;
			expect(stretch.$repo.$isValid).to.be.true;
			expect(stretch.$repo.$pattern).to.equal(null);
			expect(UpdateResult.$flush().patternNotFound).to.be.true;
		});

		/** Added v0.8.0 */
		it("Signifies when the repo is skipped by the validity checks", () => {
			// The layout is legal, but the repo fails the delta point check,
			// so the searching is skipped altogether (see threeFlap.spec).
			parseTree("(0,2,12),(0,1,2),(0,3,9)", "(1,10,5,0,0),(2,19,16,0,0),(3,0,0,0,0)");
			const stretch = State.$stretches.get("1,2,3")!;
			expect(stretch.$repo.$isValid).to.be.false;
			expect(stretch.$repo.$pattern).to.equal(null);
			expect(UpdateResult.$flush().patternNotFound).to.be.true;
		});

		/** Added v0.8.0 */
		it("Does not signify if the flaps involved form invalid junctions", () => {
			// Flaps 2 and 3 are way too close, which is already signified by the invalid junction.
			generateFromFlaps([
				{ id: 1, x: 139, y: 0, radius: 80 },
				{ id: 2, x: 73, y: 124, radius: 60 },
				{ id: 3, x: 84, y: 125, radius: 56 },
			]);
			const stretch = State.$stretches.get("1,2,3")!;
			expect(stretch.$repo.$pattern).to.equal(null);
			expect(State.$junctions.get(id2, id3)!.$valid).to.be.false;
			expect(UpdateResult.$flush().patternNotFound).to.be.false;
		});

		/** Added v0.8.0 */
		it("Ignores invalid junctions among other flaps", () => {
			// Same as the first case, plus flaps 4 and 5 forming an invalid junction far away.
			parseTree(
				"(2,0,10),(2,1,2),(2,3,3),(2,4,1),(2,5,1)",
				"(0,0,0,0,0),(1,11,5,0,0),(3,9,10,0,0),(4,40,40,0,0),(5,40,41,0,0)"
			);
			expect(State.$stretches.get("0,1,3")!.$repo.$pattern).to.equal(null);
			expect(State.$junctions.get(id4, id5)!.$valid).to.be.false;
			expect(UpdateResult.$flush().patternNotFound).to.be.true;
		});

		it("Does not signify when all stretches have patterns", () => {
			parseTree(
				"(0,1,7),(0,2,4),(0,3,1),(0,4,1)",
				"(1,0,0,0,0),(2,8,9,0,0),(3,40,40,0,0),(4,40,41,0,0)"
			);
			expect(State.$stretches.get("1,2")!.$repo.$pattern).to.not.equal(null);
			expect(State.$junctions.get(id3, id4)!.$valid).to.be.false;
			expect(UpdateResult.$flush().patternNotFound).to.be.false;
		});

	});

	it("Caches repo during dragging", () => {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,0,0,0,0)");

		// Drag into stretch
		DesignController.update({
			flaps: [{ id: id2, x: 8, y: 9, width: 0, height: 0 }],
			edges: [], dragging: true, stretches: [],
		});
		LayoutController.completeStretch("1,2");

		const stretch = State.$stretches.get("1,2")!;
		expect(stretch.$isActive).to.be.true;
		const repo = stretch.$repo;
		expect(repo.$configurations.length).to.equal(1);
		const config = repo.$configuration!;
		expect(config.$length).to.equal(2);
		expect(config.$index).to.equal(0);

		const prototype = UpdateResult.$flush().add.stretches["1,2"];

		LayoutController.switchPattern("1,2", 1);
		expect(config.$index).to.equal(1);

		// Drag out of stretch
		DesignController.update({
			flaps: [{ id: id2, x: 8, y: 10, width: 0, height: 0 }],
			edges: [], dragging: true, stretches: [],
		});
		expect(stretch.$repo).to.not.equal(repo);

		// Drag back into stretch again
		DesignController.update({
			flaps: [{ id: id2, x: 8, y: 9, width: 0, height: 0 }],
			edges: [], dragging: true, stretches: [],
		});
		LayoutController.dragEnd();
		expect(stretch.$isActive).to.be.true;
		expect(stretch.$repo).to.equal(repo);
		expect(config.$index).to.equal(1);

		DesignController.update({
			flaps: [{ id: id2, x: 11, y: 9, width: 0, height: 0 }],
			edges: [], dragging: true, stretches: [],
		});
		expect(stretch.$isActive).to.be.false;

		DesignController.update({
			flaps: [{ id: id2, x: 8, y: 9, width: 0, height: 0 }],
			edges: [], dragging: true, stretches: [],
		});
		LayoutController.dragEnd();
		expect(stretch.$isActive).to.be.true;

		// Not cached if not dragging
		DesignController.update({
			flaps: [{ id: id2, x: 8, y: 10, width: 0, height: 0 }],
			edges: [], dragging: false, stretches: [],
		});
		DesignController.update({
			flaps: [{ id: id2, x: 8, y: 9, width: 0, height: 0 }],
			edges: [], dragging: false, stretches: [prototype],
		});
		expect(stretch.$repo).to.not.equal(repo);
		expect(stretch.$repo.$configuration!.$index).to.equal(0);
	});

});
