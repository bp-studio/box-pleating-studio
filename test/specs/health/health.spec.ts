import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { getJSON } from "@utils/sample";
import { parsePath } from "@utils/path";
import { fullReset } from "core/service/state";
import { Migration } from "client/patches";
import { DesignController } from "core/controller/designController";
import { findUncoveredRegions } from "core/design/health/uncovered";
import { findDanglingRidgeEnds } from "core/design/health/danglingRidge";
import { findMissingRiverRidges, hasInwardRidge, pointsInto } from "core/design/health/riverCorner";
import { toRationalPath } from "core/math/geometry/rationalPath";
import { complete } from "../pattern/util";
import { Line } from "core/math/geometry/line";
import { Point } from "core/math/geometry/point";
import { Vector } from "core/math/geometry/vector";

import type { Path } from "shared/types/geometry";

function rect(width: number, height: number): Path {
	return parsePath(`(0,0),(${width},0),(${width},${height}),(0,${height})`);
}

/** The unsigned area of a path. */
function area(path: Path): number {
	let result = 0;
	for(let i = 0, j = path.length - 1; i < path.length; j = i++) {
		result += path[j].x * path[i].y - path[i].x * path[j].y;
	}
	return Math.abs(result) / 2;
}

/**
 * Two flaps along the left side, and a river wrapping two flaps on the right.
 * The river doesn't reach the flaps on the left.
 */
function createIncompleteLayout(): void {
	parseTree(
		"(0,1,2),(0,2,2),(0,3,4),(3,4,2),(3,5,2)",
		"(1,0,0,0,0),(2,0,8,0,0),(4,16,0,0,0),(5,16,8,0,0)"
	);
}

/**
 * River 1 holds flaps 2 and 3 placed diagonally. The river would need a
 * stretch pattern of its own, which is not supported yet, so the right angle
 * corners at (1,4), (4,1), (2,2) and (3,3) are left without ridges.
 */
function createSelfStretchLayout(): void {
	parseTree(
		"(0,1,2),(1,2,2),(1,3,2),(0,4,4)",
		"(2,0,0,0,0),(3,5,5,0,0),(4,-6,10,0,0)"
	);
}

/**
 * River 3 wraps a ring of 8 flaps, enclosing the region (5,5)-(15,15).
 * @param edges The other edges, including the parent edge of node 3.
 * @param flaps The other flaps.
 */
function createRing(edges: string, flaps: string): void {
	const ring = [
		[0, 0], [10, 0], [20, 0], [0, 10],
		[20, 10], [0, 20], [10, 20], [20, 20],
	];
	const ringEdges = ring.map((_, i) => `(3,${i + 10},1)`);
	const ringFlaps = ring.map(([x, y], i) => `(${i + 10},${x},${y},0,0)`);
	parseTree(
		[edges, ...ringEdges].join(","),
		[flaps, ...ringFlaps].join(",")
	);
}

/** The area of the hole enclosed by the ring (see {@link createRing}). */
const HOLE_AREA = 100;

/** The area of an orphan region between the flaps of the ring in the sheet. */
const STRIP_AREA = 8;

describe("Health check", () => {

	it("Finds no issues in a complete design", async () => {
		fullReset();
		const sample = await getJSON("v04.session.sample.json");
		DesignController.init(Migration.$process(sample).design);
		complete();
		const sheet = rect(42, 41);
		expect(findUncoveredRegions(sheet)).to.be.empty;
		expect(findDanglingRidgeEnds(sheet)).to.be.empty;
		expect(findMissingRiverRidges(sheet)).to.be.empty;
	});

	it("Finds the issues in an incomplete design", async () => {
		fullReset();
		const sample = await getJSON("v08.riverRidge.sample.json");
		DesignController.init(Migration.$process(sample).design);
		const report = DesignController.health(rect(20, 20));
		expect(report.invalidJunctions).to.equal(0);
		expect(report.unsolvedStretches).to.equal(0);
		const geometry = report.geometry!;
		expect(geometry.uncovered.length).to.equal(1);
		const { outer, inner } = geometry.uncovered[0];
		expect(inner).to.be.empty;
		expect(area(outer)).to.be.closeTo(1, 1e-9);

		// The 4 dangling ridges all end on the boundary of the uncovered
		// region, so they are not reported again.
		expect(findDanglingRidgeEnds(rect(20, 20)).length).to.equal(4);
		expect(geometry.danglingRidgeEnds).to.be.empty;
		expect(geometry.missingRiverRidges).to.be.empty;
	});

	describe("Uncovered regions", () => {

		it("Finds the complement of all flaps and rivers within the sheet", () => {
			parseTree("(0,1,8),(0,2,8)", "(1,0,0,0,0),(2,16,0,0,0)");
			expect(findUncoveredRegions(rect(16, 8))).to.be.empty;

			// Reaching the parts of the sheet far from the flaps
			const result = findUncoveredRegions(rect(16, 30));
			expect(result.length).to.equal(1);
			expect(result[0].inner).to.be.empty;
			expect(result[0].outer).to.equalPath(
				"(0,8),(16,8),(16,30),(0,30)", true
			);
		});

		it("Works with diagonal sheets", () => {
			parseTree("(0,1,8),(0,2,8)", "(1,8,0,0,0),(2,8,16,0,0)");
			const sheet = parsePath("(8,0),(16,8),(8,16),(0,8)");
			expect(findUncoveredRegions(sheet)).to.be.empty;

			parseTree("(0,1,4),(0,2,4)", "(1,8,0,0,0),(2,8,16,0,0)");
			const result = findUncoveredRegions(sheet);
			expect(result.length).to.equal(1);
			expect(result[0].outer).to.equalPath(
				"(4,4),(12,4),(16,8),(12,12),(4,12),(0,8)", true
			);
		});

		it("Finds the holes enclosed by the rivers", () => {
			createRing("(0,3,4),(0,1,1)", "(1,40,40,0,0)");
			const result = findUncoveredRegions(rect(20, 20));
			// The other 6 are the orphan regions between the flaps of the ring,
			// clipped by the sheet.
			expect(result.length).to.equal(7);
			const hole = result.find(c => area(c.outer) == HOLE_AREA)!;
			expect(hole.outer).to.equalPath("(5,5),(15,5),(15,15),(5,15)", true);
		});

		it("Finds the orphan regions within the sheet", () => {
			createRing("(0,3,4),(0,1,1)", "(1,40,40,0,0)");
			const result = findUncoveredRegions(rect(20, 20));
			const strip = result.find(c => area(c.outer) == STRIP_AREA)!;
			expect(strip.outer).to.equalPath("(0,11),(1,11),(1,19),(0,19)", true);
		});

		it("Leaves the holes enclosed by the children as orphan regions", () => {
			// River 5 would fill the hole enclosed by river 3 without the
			// regularization. The hole is not wider than twice its length, so
			// it becomes an orphan region of river 5 instead.
			createRing(
				"(0,2,1),(2,5,6),(5,3,4),(5,1,1),(0,9,12),(0,8,12)",
				"(1,35,10,0,0),(9,60,60,0,0),(8,-40,60,0,0)"
			);
			const result = findUncoveredRegions(rect(20, 20));
			const hole = result.find(c => area(c.outer) == HOLE_AREA)!;
			const xs = hole.outer.map(p => p.x), ys = hole.outer.map(p => p.y);
			expect([Math.min(...xs), Math.max(...xs)]).toEqual([5, 15]);
			expect([Math.min(...ys), Math.max(...ys)]).toEqual([5, 15]);
		});
	});

	describe("Dangling ridges", () => {

		it("Works with diagonal sheets", () => {
			parseTree("(0,1,8),(0,2,8)", "(1,8,0,0,0),(2,8,16,0,0)");
			const sheet = parsePath("(8,0),(16,8),(8,16),(0,8)");
			expect(findDanglingRidgeEnds(sheet)).to.be.empty;
		});

		it("Finds the ridges terminating inside the sheet", () => {
			createIncompleteLayout();
			const result = findDanglingRidgeEnds(rect(16, 8));
			expect(result).to.have.deep.members([
				{ x: 2, y: 2 },
				{ x: 2, y: 6 },
				{ x: 14, y: 2 },
				{ x: 14, y: 6 },
			]);
		});

		it("Allows ridges to terminate on or beyond the border", () => {
			parseTree("(0,1,8),(0,2,8)", "(1,0,0,0,0),(2,16,0,0,0)");
			// The ridges meet at (8,8), where the border is
			expect(findDanglingRidgeEnds(rect(16, 8))).to.be.empty;
			// The ridges meet at (8,8) inside the sheet
			expect(findDanglingRidgeEnds(rect(16, 10))).to.be.empty;
		});
	});

	describe("Missing river ridges", () => {

		it("Finds the right angle corners without inward ridges", () => {
			createSelfStretchLayout();
			const sheet = parsePath("(-4,-4),(9,-4),(9,9),(-4,9)");
			const result = findMissingRiverRidges(sheet);
			expect(result.length).to.equal(1);
			expect(result[0].id).to.equal(1);
			expect(result[0].corners).to.have.deep.members([
				{ x: 1, y: 4 }, { x: 4, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 },
			]);
		});

		it("Finds no missing ridges in the gaps excluded by regularization", () => {
			// River 3 would dip into the gap between flaps 4 and 5 without the
			// regularization, leaving the corners (14,2) and (14,6) without
			// ridges.
			createIncompleteLayout();
			expect(findMissingRiverRidges(rect(16, 8))).to.be.empty;
		});

		it("Accepts ridges within 45 degrees of the inward diagonal", () => {
			const p = new Point(0, 0);
			const v = new Vector(1, 1);
			type Coords = [number, number, number, number];
			const test = (...c: Coords): boolean => {
				const [x1, y1, x2, y2] = c;
				const ridge = new Line(new Point(x1, y1), new Point(x2, y2));
				return hasInwardRidge([ridge], p, v);
			};
			expect(test(0, 0, 2, 2)).to.be.true;
			expect(test(0, 0, 3, 4)).to.be.true; // Pattern ridges
			expect(test(-1, -1, 2, 2)).to.be.true; // Passing through
			expect(test(0, 0, 5, 0)).to.be.false; // Along the hinge
			expect(test(0, 0, -1, -1)).to.be.false;
			expect(test(0, 0, -3, 1)).to.be.false;
			expect(test(1, 0, 2, 2)).to.be.false; // Not through the corner
		});

		it("Determines whether a direction points into the sheet", () => {
			// An L-shape in counter-clockwise orientation, with a reflex
			// vertex at (5,5)
			const border = toRationalPath(
				parsePath("(0,0),(10,0),(10,5),(5,5),(5,10),(0,10)")
			);
			type Args = [number, number, number, number];
			const test = (...[x, y, vx, vy]: Args): boolean =>
				pointsInto(border, new Point(x, y), new Vector(vx, vy));
			expect(test(2, 2, 1, 1)).to.be.true; // Interior
			expect(test(20, 20, 1, 1)).to.be.false; // Exterior
			expect(test(3, 0, 1, 1)).to.be.true; // On an edge
			expect(test(3, 0, 1, -1)).to.be.false;
			expect(test(3, 0, 1, 0)).to.be.false; // Along the edge
			expect(test(0, 0, 1, 1)).to.be.true; // At a convex vertex
			expect(test(0, 0, -1, 1)).to.be.false;
			expect(test(0, 0, 1, 0)).to.be.false;
			expect(test(5, 5, -1, -1)).to.be.true; // At the reflex vertex
			expect(test(5, 5, 1, -1)).to.be.true;
			expect(test(5, 5, -1, 1)).to.be.true;
			expect(test(5, 5, 1, 1)).to.be.false;
			expect(test(5, 5, 1, 0)).to.be.false;
			expect(test(5, 5, 0, 1)).to.be.false;
		});

		it("Ignores the corners whose ridges would go outside the sheet", () => {
			createSelfStretchLayout();
			// The corner (2,2) lies on the border, with its ridge going out.
			const sheet = parsePath("(-4,-4),(2,-4),(2,9),(-4,9)");
			const result = findMissingRiverRidges(sheet);
			expect(result.length).to.equal(1);
			expect(result[0].corners).to.have.deep.members([{ x: 1, y: 4 }]);
		});
	});

	describe("Report", () => {

		it("Reports the quadrants of unsolved stretches", () => {
			// See oneIsContainedInAnother in quadrant.ts
			parseTree(
				"(0,1,10),(0,2,10),(0,3,1)",
				"(1,0,0,0,0),(2,16,16,0,0),(3,8,8,0,0)"
			);
			const report = DesignController.health(rect(16, 16));
			expect(report.invalidJunctions).to.equal(0);
			expect(report.unsolvedStretches).to.equal(1);
			expect(report.geometry).to.be.not.undefined;

			// The quadrant of flap 1 towards upper right
			const d = 40 / (3 * Math.PI);
			const near = (a: number, b: number): boolean =>
				Math.abs(a - b) < 1e-9;
			const quadrant = report.unsolvedQuadrants.find(q =>
				q.radius == 10 && near(q.centroid.x, d) && near(q.centroid.y, d)
			);
			expect(quadrant).to.be.not.undefined;
		});

		it("Performs the geometric checks only if all junctions are valid", () => {
			// Flaps 11 and 14 overlap (invalid)
			parseTree(
				"(0,1,3),(1,7,3),(7,8,2),(1,10,2),(10,11,2),(0,13,2),(13,14,3)",
				"(8,16,24,0,0),(11,24,16,0,1),(14,23,11,0,1)"
			);
			const invalid = DesignController.health(rect(24, 24));
			expect(invalid.invalidJunctions).to.be.greaterThan(0);
			expect(invalid.geometry).to.be.undefined;

			parseTree("(0,1,8),(0,2,8)", "(1,0,0,0,0),(2,16,0,0,0)");
			const valid = DesignController.health(rect(16, 8));
			expect(valid.invalidJunctions).to.equal(0);
			expect(valid.unsolvedStretches).to.equal(0);
			expect(valid.geometry!.uncovered).to.be.empty;
			expect(valid.geometry!.danglingRidgeEnds).to.be.empty;
			expect(valid.geometry!.missingRiverRidges).to.be.empty;
		});
	});
});

