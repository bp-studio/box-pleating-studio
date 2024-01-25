import { LayoutController } from "core/controller/layoutController";
import twoFlapSpec from "./twoFlap.spec";
import { id2, parseTree } from "@utils/tree";
import threeFlapSpec from "./threeFlap.spec";
import { UpdateResult } from "core/service/updateResult";
import { State, fullReset } from "core/service/state";
import { complete, generateFromFlaps } from "./util";
import { DesignController } from "core/controller/designController";
import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";

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

	it("Signifies when no pattern is found", function() {
		generateFromFlaps([
			{ id: 1, x: 0, y: 0, radius: 10 },
			{ id: 2, x: 10, y: 11, radius: 3 },
			{ id: 3, x: 11, y: 5, radius: 2 },
		]);
		const stretch = State.$stretches.get("1,2,3")!;
		expect(stretch.$repo.$pattern).to.equal(null);
		expect(UpdateResult.$flush().patternNotFound).to.be.true;
	});

	it("Caches repo during dragging", function() {
		parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
		LayoutController.completeStretch("1,2");

		const stretch = State.$stretches.get("1,2")!;
		expect(stretch.$isActive).to.be.true;
		const repo = stretch.$repo;
		expect(repo.$configurations.length).to.equal(1);
		const config = repo.$configuration!;
		expect(config.$length).to.equal(2);
		expect(config.$index).to.equal(0);

		LayoutController.switchPattern("1,2", 1);
		expect(config.$index).to.equal(1);

		LayoutController.updateFlap([{ id: id2, x: 8, y: 10, width: 0, height: 0 }], true, []);
		expect(stretch.$repo).to.not.equal(repo);

		LayoutController.updateFlap([{ id: id2, x: 8, y: 9, width: 0, height: 0 }], true, []);
		LayoutController.dragEnd();
		expect(stretch.$isActive).to.be.true;
		expect(stretch.$repo).to.equal(repo);
		expect(config.$index).to.equal(1);

		LayoutController.updateFlap([{ id: id2, x: 11, y: 9, width: 0, height: 0 }], true, []);
		expect(stretch.$isActive).to.be.false;

		LayoutController.updateFlap([{ id: id2, x: 8, y: 9, width: 0, height: 0 }], true, []);
		LayoutController.dragEnd();
		expect(stretch.$isActive).to.be.true;

		// Not cached if not dragging
		LayoutController.updateFlap([{ id: id2, x: 8, y: 10, width: 0, height: 0 }], false, []);
		LayoutController.updateFlap([{ id: id2, x: 8, y: 9, width: 0, height: 0 }], false, []);
		expect(stretch.$repo).to.not.equal(repo);
		expect(stretch.$repo.$configuration!.$index).to.equal(0);
	});

	describe("Two flap patterns", twoFlapSpec);
	describe("Three flap patterns", threeFlapSpec);
}

