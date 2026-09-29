import { expect } from "chai";

import { LayoutController } from "core/controller/layoutController";
import twoFlapSpec from "./twoFlap.spec";
import { id2, parseTree } from "@utils/tree";
import threeFlapSpec from "./threeFlap.spec";
import { UpdateResult } from "core/service/updateResult";
import { State, fullReset } from "core/service/state";
import { complete } from "./util";
import { DesignController } from "core/controller/designController";
import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";

import type { JEdge, JFlap } from "shared/json";

export default function() {

	it("Loads saved patterns", async function() {
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
	it("Recognizes the saved pattern when searching", function() {
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
	it("Serializes patterns without caches", function() {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		complete();
		UpdateResult.$flush(); // Make sure that the devices are rendered, so that the caches are filled
		const json = JSON.stringify(State.$stretches.get("1,2")!.toJSON());
		expect(json).to.not.match(/"[$_]\w*":/);
	});

	it("Signifies when no pattern is found", function() {
		parseTree("(2,0,10),(2,1,2),(2,3,3)", "(0,0,0,0,0),(1,11,5,0,0),(3,9,10,0,0)");
		const stretch = State.$stretches.get("0,1,3")!;
		expect(stretch.$repo.$pattern).to.equal(null);
		expect(UpdateResult.$flush().patternNotFound).to.be.true;
	});

	it("Caches repo during dragging", function() {
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

	describe("Two flap patterns", twoFlapSpec);

	describe("Three flap patterns", threeFlapSpec);
}
