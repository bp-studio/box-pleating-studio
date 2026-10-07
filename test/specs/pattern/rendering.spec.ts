import { describe, it, expect } from "@rstest/core";

import { id1, id2, id3, id4, parseTree } from "@utils/tree";
import { State, fullReset } from "core/service/state";
import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";
import { TreeController } from "core/controller/treeController";
import { UpdateResult } from "core/service/updateResult";
import { complete, generateFromFlaps } from "./util";
import { DesignController } from "core/controller/designController";
import { LayoutController } from "core/controller/layoutController";

import type { ILine } from "shared/types/geometry";
import type { NodeId } from "shared/json/tree";

describe("Rendering", () => {

	it("Updates ridges when edges merge or split", () => {
		parseTree("(0,1,2),(0,2,2),(0,4,1),(4,3,7)", "(1,9,5,0,0),(2,6,8,0,0),(3,0,0,0,0)");
		complete();
		const result1 = UpdateResult.$flush();
		const ridges1 = result1.graphics["s1,2,3.0"].ridges;
		expect(ridges1).to.containLine([{ x: 4.5, y: 3.5 }, { x: 6, y: 5 }]);

		TreeController.join(id4);
		const result2 = UpdateResult.$flush();
		const data2 = result2.graphics["s1,2,3.0"];
		expect(data2).to.be.not.undefined;
		const ridges2 = data2.ridges;
		expect(ridges2).to.not.containLine(
			[{ x: 4.5, y: 3.5 }, { x: 6, y: 5 }]
		);
		expect(ridges2).to.containLine([{ x: 4.5, y: 3.5 }, { x: 7, y: 6 }]);
	});

	it("Update origin when all flaps move simultaneously", () => {
		generateFromFlaps([
			{ id: 1, x: 9, y: 5, radius: 2 },
			{ id: 2, x: 0, y: 0, radius: 8 },
			{ id: 3, x: 6, y: 8, radius: 2 },
		]);
		const stretch = State.$stretches.get("1,2,3")!;
		expect(stretch).to.be.not.undefined;
		const repo = stretch.$repo;

		DesignController.update({
			flaps: [
				{ id: id1, x: 10, y: 6, width: 0, height: 0 },
				{ id: id2, x: 1, y: 1, width: 0, height: 0 },
				{ id: id3, x: 7, y: 9, width: 0, height: 0 },
			],
			edges: [],
			dragging: false,
			stretches: [],
		});

		expect(State.$stretches.get("1,2,3")).to.equal(stretch);
		expect(stretch.$repo).to.equal(repo);
	});

	it("Connects river ridges to free corners regardless of stretch order", async () => {
		fullReset();
		const sample = await getJSON("v08.riverRidge.sample.json");
		DesignController.init(Migration.$process(sample).design);
		const ridge: ILine = [{ x: 11, y: 13 }, { x: 8, y: 16 }];
		const river = State.m.$tree.$nodes[4 as NodeId]!.$graphics;
		expect(river.$ridges).to.containLine(ridge);

		// Moving the flap back and forth changes the order of the stretches,
		// and the free corner at (11,13) (the starting point of the ridge
		// itself) used to be picked, resulting in a degenerated ridge.
		const move = (x: number): void => DesignController.update({
			flaps: [{ id: 16 as NodeId, x, y: 15, width: 0, height: 0 }],
			edges: [], dragging: false, stretches: [],
		});
		move(16);
		move(15);
		expect(river.$ridges).to.containLine(ridge);
	});

	/** Added v0.8.0 */
	it("Does not connect river ridges to free corners on the same side", () => {
		// The ridge shot from the inner corner (57,57) of river 1 (that is,
		// the corner of flap 5) hits the free corner (59,55), which is a
		// vertex of the contour of flap 4, on the inner side of the river as
		// well. It is not related to the corner.
		parseTree(
			"(0,6,1),(0,1,2),(6,8,4),(1,4,4),(1,5,1),(8,10,2)",
			"(4,62,59,0,0),(5,56,58,0,0),(10,50,50,0,0)"
		);
		const pattern = State.$stretches.get("4,5,10")!.$repo.$pattern!;
		const { x, y } = pattern.$devices[0].$location;
		LayoutController.moveDevice("4,5,10", 0, { x: x - 2, y: y - 2 });
		const river = State.m.$tree.$nodes[1 as NodeId]!.$graphics;
		const ridge: ILine = [{ x: 57, y: 57 }, { x: 59, y: 55 }];
		expect(river.$ridges).to.not.containLine(ridge);
	});

	/** Added v0.8.0 */
	it("Connects river ridges to free corners of repos in the same direction", () => {
		// In both cases, the ridge shot from a right angle corner of the river
		// happens to hit a free corner of a gadget of a repo in the other
		// direction, which is unrelated. Previously, the ridge crossed the
		// hinges of other flaps.
		parseTree(
			"(13,0,1),(0,4,3),(4,5,2),(4,6,3),(4,20,1)",
			"(5,0,17,0,0),(6,4,20,0,0),(20,-1,22,0,0)"
		);
		const river4 = State.m.$tree.$nodes[4 as NodeId]!.$graphics;
		const ridge4: ILine = [{ x: 0, y: 21 }, { x: 3, y: 18 }];
		expect(river4.$ridges).to.not.containLine(ridge4);

		parseTree(
			"(13,0,3),(0,3,7),(3,12,1),(13,16,1),(0,19,3)",
			"(12,22,4,0,0),(16,15,15,0,0),(19,10,10,0,0)"
		);
		const river3 = State.m.$tree.$nodes[3 as NodeId]!.$graphics;
		const ridge3: ILine = [{ x: 21, y: 5 }, { x: 14, y: 12 }];
		expect(river3.$ridges).to.not.containLine(ridge3);
	});

	/** Added v0.8.0 */
	it("Does not connect river ridges across the hinges of the river", () => {
		// The ridge shot from the corner (-1,20) of flap 20 hits a free corner
		// of the gadget of flaps 5 and 10 (in the same direction), but only
		// after running across flap 5.
		parseTree(
			"(0,4,5),(0,10,1),(4,5,2),(4,20,1)",
			"(5,0,17,0,0),(10,6,11,0,0),(20,-2,21,0,0)"
		);
		const river = State.m.$tree.$nodes[4 as NodeId]!.$graphics;
		const ridge: ILine = [{ x: -1, y: 20 }, { x: 4, y: 15 }];
		expect(river.$ridges).to.not.containLine(ridge);
	});

});
