import { id1, id2, id3, id4, parseTree } from "@utils/tree";
import { State } from "core/service/state";
import { TreeController } from "core/controller/treeController";
import { UpdateResult } from "core/service/updateResult";
import { complete, generateFromFlaps } from "./util";
import { DesignController } from "core/controller/designController";

export default function() {
	it("Updates ridges when edges merge or split", function() {
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
		expect(ridges2).to.not.containLine([{ x: 4.5, y: 3.5 }, { x: 6, y: 5 }]);
		expect(ridges2).to.containLine([{ x: 4.5, y: 3.5 }, { x: 7, y: 6 }]);
	});

	it("Update origin when all flaps move simultaneously", function() {
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
}
