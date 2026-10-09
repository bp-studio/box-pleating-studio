import { describe, it, expect } from "@rstest/core";

import { parsePath } from "@utils/path";
import { expand } from "core/design/tasks/roughContour";
import { isClockwise } from "core/math/geometry/path";

import type { NodeId } from "shared/json/tree";
import type { RoughContour } from "core/design/context";
import type { PathEx } from "shared/types/geometry";

describe("Expansion operation", () => {
	it("Excludes degenerated holes", () => {
		const result = expand([
			makeRoughContour("(1,1),(1,0),(5,0),(5,1),(6,1),(6,5),(5,5),(5,6),(1,6),(1,5),(0,5),(0,1)"),
			makeRoughContour("(2,2),(2,4),(4,4),(4,2)"), // This is a hole
		], 1);
		expect(result.length).to.equal(1);
		// The hole degenerates and vanishes
		expect(result[0].$outer.length).to.equal(1);
		expect(result[0].$outer[0]).to.equalPath("(0,0),(0,-1),(6,-1),(6,0),(7,0),(7,6),(6,6),(6,7),(0,7),(0,6),(-1,6),(-1,0)", true);
	});

	it("Excludes over-shrunk holes", () => {
		const result = expand([
			makeRoughContour("(1,1),(1,0),(5,0),(5,1),(6,1),(6,5),(5,5),(5,6),(1,6),(1,5),(0,5),(0,1)"),
			makeRoughContour("(2,2),(2,4),(4,4),(4,2)"), // This is a hole
		], 2);
		expect(result.length).to.equal(1);
		expect(result[0].$outer.length).to.equal(1); // The hole over-shrunk
	});

	it("Expands holes with repeated points", () => {
		const result = expand([
			makeRoughContour("(0,0),(8,0),(8,8),(0,8)", "(1,4),(1,7),(4,7),(4,4),(7,4),(7,1),(4,1),(4,4)"),
		], 1);
		expect(result.length).to.equal(1);
		expect(result[0].$outer.length).to.equal(3);
		const holes = result[0].$outer.filter(p => p.isHole);
		expect(holes.length).to.equal(2);
		expect(holes[0]).to.equalPath("(3,6),(3,5),(2,5),(2,6)", true);
		expect(holes[1]).to.equalPath("(6,3),(6,2),(5,2),(5,3)", true);
	});
});

function makeRoughContour(...outer: string[]): RoughContour {
	const $outer = outer.map(parsePath);
	for(const path of $outer) {
		if(isClockwise(path)) (path as PathEx).isHole = true;
	}
	return { $id: 0 as NodeId, $outer, $children: [], $leaves: [] };
}
