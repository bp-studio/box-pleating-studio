import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { buildRandomDesign } from "@utils/consistency";
import { State } from "core/service/state";
import { getDist } from "core/design/context/treeUtils";
import { getMinimalTree } from "core/design/health/minimalTree";
import { parseFlaps } from "shared/utils/treeString";

import type { TreeString } from "core/design/health/minimalTree";
import type { NodeId } from "shared/json";

function minimalTreeOf(id: string): TreeString {
	const stretch = State.$stretches.get(id)!;
	expect(stretch).to.be.not.undefined;
	return getMinimalTree(stretch.$repo.$nodeSet.$leaves);
}

interface StretchInfo {
	tree: TreeString;
	solved: boolean;
	valid: boolean;
	junctions: number;
	/** The distances between the flaps, in the new ids. */
	distances: Map<string, number>;
}

/** Collect the info of all stretches in the current design. */
function collectStretches(): StretchInfo[] {
	const nodes = State.m.$tree.$nodes;
	return [...State.$stretches.values()].map(stretch => {
		const repo = stretch.$repo;
		const leaves = repo.$nodeSet.$leaves;
		const tree = getMinimalTree(leaves);

		// Match the flaps by their rectangles relative to the minimal corner.
		const rects = leaves.map(id => nodes[id]!.$AABB.$toValues());
		const minX = Math.min(...rects.map(r => r[3]));
		const minY = Math.min(...rects.map(r => r[2]));
		const newIds = parseFlaps(tree.flaps);
		const toNew = (i: number): number => {
			const [t, r, b, l] = rects[i];
			return newIds.find(f =>
				f.x == l - minX && f.y == b - minY &&
				f.width == r - l && f.height == t - b
			)!.id;
		};
		const distances = new Map<string, number>();
		for(let i = 0; i < leaves.length; i++) {
			for(let j = i + 1; j < leaves.length; j++) {
				const [a, b] = [toNew(i), toNew(j)].sort((x, y) => x - y);
				const d = getDist(nodes[leaves[i]]!, nodes[leaves[j]]!);
				distances.set(`${a},${b}`, d);
			}
		}

		return {
			tree,
			solved: Boolean(repo.$pattern),
			valid: repo.$isValid,
			junctions: repo.$junctions.length,
			distances,
		};
	});
}

describe("Minimal tree", () => {

	it("Describes the stretch in the format of parseTree", () => {
		// See searching.spec
		parseTree("(2,0,10),(2,1,2),(2,3,2)", "(0,0,0,0,0),(1,11,5,0,0),(3,7,10,0,0)");
		const tree = minimalTreeOf("0,1,3");
		expect(tree.edges).to.equal("(0,1,10),(0,2,2),(0,3,2)");
		expect(tree.flaps).to.equal("(1,0,0,0,0),(2,7,10,0,0),(3,11,5,0,0)");
	});

	it("Ignores the irrelevant parts of the tree", () => {
		// Same as above, with the edge (2,1) split, translated, and with an
		// unrelated flap far away.
		parseTree(
			"(2,0,10),(2,9,1),(9,1,1),(2,3,2),(2,4,1)",
			"(0,5,5,0,0),(1,16,10,0,0),(3,12,15,0,0),(4,40,40,0,0)"
		);
		const tree = minimalTreeOf("0,1,3");
		expect(tree.edges).to.equal("(0,1,10),(0,2,2),(0,3,2)");
		expect(tree.flaps).to.equal("(1,0,0,0,0),(2,7,10,0,0),(3,11,5,0,0)");
	});

	it("Uses the same root regardless of the original one", () => {
		// The root of the original tree lies between flaps 1 and 2.
		parseTree("(0,1,3),(0,5,2),(5,2,1),(5,6,1),(6,3,2),(6,4,2)", "(1,0,0,0,0),(2,5,4,0,0)");
		const tree = minimalTreeOf("1,2");
		expect(tree.edges).to.equal("(0,1,3),(0,2,3)");
		expect(tree.flaps).to.equal("(1,0,0,0,0),(2,5,4,0,0)");
	});

	it("Reproduces the stretches in random designs", () => {
		let count = 0;
		for(let seed = 1; seed <= 300; seed++) {
			buildRandomDesign(seed)();
			for(const info of collectStretches()) {
				count++;
				const message = `seed ${seed}: ${info.tree.edges} ${info.tree.flaps}`;
				parseTree(info.tree.edges, info.tree.flaps);
				const nodes = State.m.$tree.$nodes;
				for(const [key, d] of info.distances) {
					const [a, b] = key.split(",").map(Number) as NodeId[];
					expect(getDist(nodes[a]!, nodes[b]!), message).to.equal(d);
				}

				expect(State.$stretches.size, message).to.equal(1);
				const [stretch] = State.$stretches.values();
				const repo = stretch.$repo;
				const junctions = repo.$junctions.length;
				expect(junctions, message).to.equal(info.junctions);
				expect(Boolean(repo.$pattern), message).to.equal(info.solved);
				expect(repo.$isValid, message).to.equal(info.valid);
				const tree = getMinimalTree(repo.$nodeSet.$leaves);
				expect(tree, message).to.deep.equal(info.tree);
			}
		}
		expect(count).to.be.greaterThan(100);
	});
});
