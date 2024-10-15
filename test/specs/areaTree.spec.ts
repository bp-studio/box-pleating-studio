import { id0, parseTree } from "@utils/tree";
import { AreaTree } from "core/design/context/areaTree/areaTree";
import { TreeController } from "core/controller/treeController";

import type { AreaNode } from "core/design/context/areaTree/areaNode";

describe("AreaTree", function() {

	it("Simplifies tree structure", function() {
		const tree = parseTree("(0,1,1),(1,2,1),(0,3,1),(3,4,1)");
		const aTree = new AreaTree(tree, false);
		const nodes = aTree.$nodes.filter(n => n) as AreaNode[];
		expect(nodes.length).to.equal(3);
		const ids = nodes.map(c => c.id);
		expect(ids).to.eql([0, 2, 4]);
	});

	it("Balances tree by area", function() {
		const tree = parseTree(
			"(0,1,1),(1,2,1),(1,3,1),(0,4,1),(4,5,4),(4,6,3)",
			"(2,0,0,1,1),(3,0,0,0,0),(5,0,0,0,0),(6,0,0,0,0)"
		);
		const aTree = new AreaTree(tree, true);
		expect(aTree.$root.$parent).to.be.undefined;
		expect(aTree.$root.id).to.equal(4);
		const areas = [...aTree.$root.$children].map(c => c.$area);
		expect(areas).to.eql([16, 9, (Math.sqrt(2 + 5 / Math.PI) + 1) ** 2]);
		expect(aTree.$nodes[id0]!.$length).to.equal(1);
	});

	it("Creates hierarchy", function() {
		// GuanYu
		parseTree("(16,20,3),(16,49,2),(16,9,1),(16,18,1),(16,7,1),(20,29,1),(20,21,4),(20,23,3),(20,24,3),(20,25,2),(20,26,1),(20,27,1),(20,28,1),(20,22,2),(49,38,1),(49,50,1),(9,12,1),(9,15,2),(9,10,3),(9,11,1),(18,19,14),(18,17,7),(7,0,5),(7,8,1),(29,32,1),(29,37,6),(29,31,5),(38,39,2),(38,46,2),(12,14,1),(12,13,1),(0,1,1),(0,2,1),(0,3,1),(0,4,1),(0,5,1),(0,6,1),(32,33,2),(32,30,5),(39,45,1),(39,41,1),(39,42,1),(39,43,1),(39,44,1),(39,40,1),(46,47,1),(46,48,1),(33,34,7),(33,35,1),(33,36,7)");
		const hierarchies = TreeController.getHierarchy(true, false);
		expect(hierarchies.length).to.equal(3);
		expect(hierarchies.map(h => h.leaves.length)).to.eql([5, 31, 37]);
	});
});
