import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { runConsistencySession } from "@utils/consistency";
import { State } from "core/service/state";
import { AAUnion } from "core/math/sweepLine/polyBool";
import { orient } from "core/design/health/utils";

import type { Path } from "shared/types/geometry";
import type { NodeId } from "shared/json/tree";

function area(path: Path): number {
	let result = 0;
	for(let i = 0; i < path.length; i++) {
		const p = path[i], q = path[(i + 1) % path.length];
		result += p.x * q.y - q.x * p.y;
	}
	return result / 2;
}

const round = (v: number): number => Math.round(v * 1e6) / 1e6;

/** The areas of the orphan regions of the given rivers. */
function orphanAreas(edges: string, flaps: string, ids: number[]): number[] {
	parseTree(edges, flaps);
	return ids.map(id => round(State.m.$tree.$nodes[id as NodeId]!.$graphics
		.$orphans.reduce((total, path) => total + Math.abs(area(path)), 0)));
}

/**
 * The total area of the orphan regions, and the area of the union of the
 * rough contours not covered by the regions of the flaps and rivers or the
 * orphan regions (negative if they overlap). The latter must be zero in valid
 * layouts, as the regularization only takes the orphan regions out of the
 * rivers (see also `checkArea` in `tools/renderCheck`).
 */
function orphanAndGapAreas(edges: string, flaps: string): [number, number] {
	parseTree(edges, flaps);
	const rough = [...State.m.$tree.$root.$children].flatMap(node =>
		node.$graphics.$roughContours.map(c =>
			c.$outer.map(p => orient(p, !p.isHole))
		)
	);
	const roughArea = new AAUnion().$get(...rough)
		.reduce((total, path) => total + area(path), 0);
	const abs = (path: Path): number => Math.abs(area(path));
	let regions = 0, orphans = 0;
	for(const node of State.m.$tree.$nodes) {
		if(!node?.$parent) continue;
		for(const contour of node.$graphics.$contours) {
			regions += abs(contour.outer);
			for(const hole of contour.inner ?? []) regions -= abs(hole);
		}
		for(const path of node.$graphics.$orphans) orphans += abs(path);
	}
	return [round(orphans), round(Math.abs(roughArea) - regions - orphans)];
}

describe("River regularization", () => {

	describe("Without junctions", () => {

		it("Fills narrow gaps between the children", () => {
			expect(orphanAreas(
				"(0,1,2),(1,2,2),(1,3,2),(0,4,4)",
				"(2,0,0,0,0),(3,6,0,0,0),(4,3,12,0,0)", [1]
			)).toEqual([8]);
		});

		it("Fills gaps of exactly twice the length", () => {
			expect(orphanAreas(
				"(0,1,2),(1,2,2),(1,3,2),(0,4,4)",
				"(2,0,0,0,0),(3,8,0,0,0),(4,4,12,0,0)", [1]
			)).toEqual([16]);
		});

		it("Keeps wide gaps and diagonal gaps", () => {
			expect(orphanAreas(
				"(0,1,2),(1,2,2),(1,3,2),(0,4,4)",
				"(2,0,0,0,0),(3,9,0,0,0),(4,4,12,0,0)", [1]
			)).toEqual([0]);
			expect(orphanAreas(
				"(0,1,2),(1,2,2),(1,3,2),(0,4,4)",
				"(2,0,0,0,0),(3,5,5,0,0),(4,-6,10,0,0)", [1]
			)).toEqual([0]);
		});

		it("Handles nested rivers and rectangular flaps", () => {
			expect(orphanAreas(
				"(0,1,1),(1,2,1),(2,3,1),(2,4,1),(1,5,2),(0,7,1),(7,6,2)",
				"(3,0,0,0,0),(4,3,0,0,0),(5,1,-5,0,0),(6,1,14,0,0)", [1, 2]
			)).toEqual([4, 2]);
			expect(orphanAreas(
				"(0,1,2),(1,2,1),(1,3,1),(0,4,4)",
				"(2,0,0,6,1),(3,0,4,1,5),(4,12,14,0,0)", [1]
			)).toEqual([3]);
		});

		it("Fills gaps facing other gaps", () => {
			expect(orphanAreas(
				"(0,1,2),(1,3,2),(1,5,3),(1,6,1),(0,7,1),(7,9,1)",
				"(3,56,50,0,0),(5,47,50,0,0),(6,50,57,0,0),(9,73,37,0,0)", [1]
			)).toEqual([23]);
		});
	});

	describe("With patterns", () => {

		it("Fills gaps away from the patterns", () => {
			expect(orphanAreas(
				"(0,1,1),(1,2,2),(1,3,2),(0,4,5)",
				"(2,0,0,0,0),(3,5,0,0,0),(4,-7,-4,0,0)", [1]
			)).toEqual([4]);
			expect(orphanAreas(
				"(0,1,1),(1,2,6),(1,3,6),(1,4,2),(0,5,2)",
				"(2,0,0,0,0),(3,11,5,0,0),(4,9,-4,0,0),(5,-8,14,0,0)", [1]
			)).toEqual([9]);
		});

		it("Does not fill the regions carved by invasions", () => {
			expect(orphanAreas(
				"(13,0,3),(13,15,1),(13,16,1),(0,3,7),(0,19,3),(15,14,1)," +
				"(3,12,1),(14,18,1)",
				"(12,20,4,0,0),(16,15,15,0,0),(18,20,20,0,0),(19,10,10,0,0)", [0]
			)).toEqual([0]);
		});

		it("Stops at the corners of the patterns", () => {
			expect(orphanAreas(
				"(13,0,3),(13,15,1),(13,16,1),(0,4,5),(0,19,3),(15,14,1)," +
				"(4,6,3),(14,18,1)",
				"(6,4,22,0,0),(16,15,15,0,0),(18,20,20,0,0),(19,10,10,0,0)", [0]
			)).toEqual([4]);
			expect(orphanAreas(
				"(0,1,2),(1,2,4),(2,3,2),(1,7,3),(0,8,1),(8,9,1)",
				"(3,50,50,0,0),(7,50,36,0,1),(9,44,42,0,0)", [1]
			)).toEqual([20]);
		});

		it("Does not fill across the cuts of the patterns", () => {
			expect(orphanAreas(
				"(1,3,2),(3,4,2),(1,7,6),(7,8,4),(7,9,2)",
				"(4,57,50,0,2),(8,50,65,0,0),(9,62,63,0,0)", [7]
			)).toEqual([18]);
			expect(orphanAreas(
				"(2,4,1),(2,6,4),(6,7,3),(6,8,2)",
				"(4,34,57,0,0),(7,28,50,0,0),(8,40,51,0,0)", [6]
			)).toEqual([21]);
			expect(orphanAreas(
				"(2,4,2),(2,6,4),(6,7,3),(6,8,2)",
				"(4,34,57,0,0),(7,28,50,0,0),(8,40,51,0,0)", [6]
			)).toEqual([14]);
		});
	});

	it("Keeps the rivers wrapping inside the holes in raw mode", () => {
		// Minimized from a design of a lobster. Rivers 6 and 10 are in raw
		// mode, and wrap inside the hole of river 5. Their inner paths are the
		// copies of the outer paths of the children, which lose the roles of
		// the paths, so the hole must not be taken as filled.
		const [orphans, gap] = orphanAndGapAreas(
			"(60,13,1),(60,10,1),(60,61,1),(13,15,1),(10,6,1),(15,17,1),(6,5,1)," +
			"(6,9,10),(17,19,1),(5,76,1),(5,7,11),(5,46,4),(19,52,1),(76,89,1)," +
			"(76,75,1),(76,77,1),(76,85,1),(76,88,1),(52,56,1),(89,90,2),(75,1,1)," +
			"(77,78,1),(85,86,2),(90,94,2),(90,95,2),(1,70,4),(94,99,1)",
			"(7,27,64,0,0),(9,25,40,0,0),(46,57,71,0,0),(56,46,45,0,0)," +
			"(61,37,48,0,0),(70,49,98,0,0),(78,45,79,0,0),(86,43,85,0,0)," +
			"(88,50,74,0,0),(95,63,98,0,0),(99,69,83,0,0)"
		);
		expect(orphans).toBeGreaterThan(0);
		expect(gap).toBe(0);
	});

	it("Removes the components of rivers without inner paths", () => {
		// Minimized from a design of a lobster. The orphan region of river 5
		// cuts off a piece of it that surrounds no children.
		const [orphans, gap] = orphanAndGapAreas(
			"(13,15,1),(13,60,1),(15,59,1),(60,10,1),(10,6,1),(6,5,1),(5,76,1)," +
			"(5,7,11),(76,1,3),(1,72,2),(72,67,1),(72,74,1),(67,2,22),(67,69,1)",
			"(2,1,100,0,0),(7,27,64,0,0),(59,41,49,0,0),(69,23,86,0,0)," +
			"(74,31,84,0,0)"
		);
		const node = State.m.$tree.$nodes[5 as NodeId]!;
		expect(node.$graphics.$contours.every(c => c.inner?.length)).toBe(true);
		expect(node.$graphics.$orphans.map(area).map(Math.abs))
			.to.include(2);
		expect(gap).toBe(0);
	});

	it("Does not regularize if a pattern involves only part of the children", () => {
		// Flap 9 forms a valid junction with 3 and an invalid one with 7.
		expect(orphanAreas(
			"(0,1,2),(1,2,4),(2,3,2),(1,7,2),(0,8,1),(8,9,1)",
			"(3,52,51,0,0),(7,47,39,0,1),(9,44,42,0,0)", [1]
		)).toEqual([0]);
	});

	it("Yields the same graphics as computing from scratch", () => {
		for(let seed = 1; seed <= 20; seed++) {
			const failure = runConsistencySession(seed, 100, 5);
			expect(failure?.diff, `seed ${seed}`).toBeUndefined();
		}
	});
});
