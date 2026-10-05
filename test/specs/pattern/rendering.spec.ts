import { describe, it, expect } from "@rstest/core";

import { id1, id2, id3, id4, parseTree } from "@utils/tree";
import { State, fullReset } from "core/service/state";
import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";
import { TreeController } from "core/controller/treeController";
import { UpdateResult } from "core/service/updateResult";
import { complete, generateFromFlaps } from "./util";
import { DesignController } from "core/controller/designController";

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

});
