/* eslint-disable max-len */
import { expect } from "chai";

import { Trace } from "core/design/layout/trace/trace";
import { Line } from "core/math/geometry/line";
import { Direction, SlashDirection } from "shared/types/direction";
import { parsePath } from "../utils/path";
import { mapDirections } from "core/math/geometry/path";
import { createSegments } from "core/design/layout/trace/hingeSegment";

import type { SideDiagonal } from "core/design/layout/configuration";

describe("Tracing algorithm", function() {

	describe("Hinge segmentation", function() {
		it("Determines corner direction", function() {
			const path = parsePath("(2,3),(1,3),(1,2),(0,2),(0,1),(1,1),(1,0),(2,0),(2,1),(3,1),(3,2),(2,2)");
			expect(mapDirections(path)).to.eql([0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0, 0]);
		});

		it("Segment hinges", function() {
			const path = parsePath("(2,3),(1,3),(1,2),(0,2),(0,1),(1,1),(1,0),(2,0),(2,1),(3,1),(3,2),(2,2)");
			const segments = createSegments(path, SlashDirection.FW);
			expect(segments.length).to.equal(2);
			expect(segments[0].$dir).to.equal(Direction.LL);
			expect(segments[0]).to.equalPath("(0,2),(0,1),(1,1),(1,0),(2,0)");
			expect(segments[1].$dir).to.equal(Direction.UR);
			expect(segments[1]).to.equalPath("(3,1),(3,2),(2,2),(2,3),(1,3)");
		});

		it("Works with connected segments", function() {
			const path = parsePath("(0,0),(1,0),(1,1),(0,1)");
			const segments = createSegments(path, SlashDirection.FW);
			expect(segments.length).to.equal(2);
			expect(segments[0].$dir).to.equal(Direction.UR);
			expect(segments[0]).to.equalPath("(1,0),(1,1),(0,1)");
			expect(segments[1].$dir).to.equal(Direction.LL);
			expect(segments[1]).to.equalPath("(0,1),(0,0),(1,0)");
		});
	});

	describe("Initial vector", function() {

		it("Should ignore intersection at the head of an edge when intersecting with normal ridges", function() {
			const trace = new Trace(Line.$parseTest([{ p1: "(20, 9)", p2: "(21, 11)" }, { p1: "(21, 11)", p2: "(27, 13)" }, { p1: "(27, 13)", p2: "(26, 11)" }, { p1: "(26, 11)", p2: "(20, 9)" }, { p1: "(20, 9)", p2: "(20, 9)" }, { p1: "(27, 13)", p2: "(27, 13)" }, { p1: "(19, 0)", p2: "(21, 8)" }, { p1: "(21, 8)", p2: "(26, 11)" }, { p1: "(26, 11)", p2: "(24, 3)" }, { p1: "(24, 3)", p2: "(19, 0)" }, { p1: "(19, 0)", p2: "(19, 0)" }, { p1: "(26, 11)", p2: "(26, 11)" }, { p1: "(21, 8)", p2: "(21, 8)", type: 3 }]), SlashDirection.FW, Line.$parseTest<SideDiagonal>([{ p1: "(22, 12)", p2: "(20, 10)", p0: "(21, 11)" }, { p1: "(27, 6)", p2: "(29, 8)", p0: "(24, 3)" }]));
			const result = trace.$generate([{ x: 21, y: 10 }, { x: 17, y: 10 }, { x: 17, y: 8 }, { x: 21, y: 8 }]);

			expect(result.length).to.equal(1);
			expect(result[0]).to.deep.equal([
				{ x: 21, y: 8 },
				{ x: 21, y: 28 / 3 },
				{ x: 20.5, y: 10 },
			]);
		});

	});

	describe("Reflection", function() {

		it("Find the next intersection by shift-touchability", function() {
			const trace = new Trace(Line.$parseTest([{ p1: "(5, 12)", p2: "(4, 7)" }, { p1: "(4, 7)", p2: "(5, 11/2)" }, { p1: "(5, 11/2)", p2: "(0, 0)" }, { p1: "(0, 0)", p2: "(2, 10)" }, { p1: "(2, 10)", p2: "(5, 12)" }, { p1: "(15, 8)", p2: "(12, 3)" }, { p1: "(12, 3)", p2: "(0, 0)" }, { p1: "(5, 11/2)", p2: "(15, 8)" }, { p1: "(4, 7)", p2: "(5, 6)" }, { p1: "(5, 6)", p2: "(5, 11/2)" }, { p1: "(5, 12)", p2: "(5, 12)" }, { p1: "(0, 0)", p2: "(0, 0)" }, { p1: "(15, 8)", p2: "(15, 8)" }, { p1: "(5, 6)", p2: "(9, 10)", type: 3 }]), SlashDirection.FW, Line.$parseTest<SideDiagonal>([{ p1: "(3, 11)", p2: "(0, 8)", p0: "(2, 10)" }, { p1: "(8, -1)", p2: "(11, 2)", p0: "(12, 3)" }]));
			const result = trace.$generate([{ x: 8, y: 8 }, { x: -8, y: 8 }, { x: -8, y: -8 }, { x: 8, y: -8 }]);

			expect(result.length).to.equal(1);
			expect(result[0]).to.deep.equal([
				{ x: 8, y: -1 },
				{ x: 8, y: 2 },
				{ x: 6, y: 5.75 },
				{ x: 6, y: 7 },
				{ x: 4, y: 7 },
				{ x: 1.6, y: 8 },
			]);
		});

	});

	describe("Trace ending", function() {

		it("Should end tracing if the next trace overlaps an existing hinge", function() {
			const trace = new Trace(Line.$parseTest([{ p1: "(18, 9)", p2: "(17, 11)" }, { p1: "(17, 11)", p2: "(11, 13)" }, { p1: "(11, 13)", p2: "(12, 11)" }, { p1: "(12, 11)", p2: "(18, 9)" }, { p1: "(18, 9)", p2: "(18, 9)" }, { p1: "(11, 13)", p2: "(11, 13)" }, { p1: "(19, 0)", p2: "(17, 8)" }, { p1: "(17, 8)", p2: "(12, 11)" }, { p1: "(12, 11)", p2: "(14, 3)" }, { p1: "(14, 3)", p2: "(19, 0)" }, { p1: "(19, 0)", p2: "(19, 0)" }, { p1: "(12, 11)", p2: "(12, 11)" }, { p1: "(17, 8)", p2: "(17, 8)", type: 3 }]), SlashDirection.BW, Line.$parseTest<SideDiagonal>([{ p1: "(18, 10)", p2: "(16, 12)", p0: "(17, 11)" }, { p1: "(9, 8)", p2: "(11, 6)", p0: "(14, 3)" }]));
			const result = trace.$generate(parsePath("(21,10),(17,10),(17,8),(21,8)"));

			expect(result.length).to.equal(1);
			expect(result[0]).to.deep.equal([
				{ x: 18, y: 10 },
				{ x: 17.5, y: 10 },
				{ x: 17, y: 28 / 3 },
			]);
		});

		it("But should not end if the next trace is degenerated", function() {
			const trace = new Trace(Line.$parseTest([{ p1: "(3, 22)", p2: "(41/2, 9/2)" }, { p1: "(41/2, 9/2)", p2: "(22, 4)" }, { p1: "(22, 4)", p2: "(15, 18)" }, { p1: "(15, 18)", p2: "(3, 22)" }, { p1: "(1, 23)", p2: "(6, 8)" }, { p1: "(6, 8)", p2: "(18, 2)" }, { p1: "(18, 2)", p2: "(17, 5)" }, { p1: "(17, 5)", p2: "(41/2, 9/2)" }, { p1: "(3, 22)", p2: "(1, 23)" }, { p1: "(17, 5)", p2: "(19, 4)" }, { p1: "(19, 4)", p2: "(41/2, 9/2)" }, { p1: "(22, 4)", p2: "(22, 4)" }, { p1: "(1, 23)", p2: "(1, 23)" }, { p1: "(18, 2)", p2: "(19, 1)" }, { p1: "(19, 4)", p2: "(20, 3)", type: 3 }]), SlashDirection.BW, Line.$parseTest<SideDiagonal>([{ p1: "(28, 5)", p2: "(15, 18)", p0: "(15, 18)" }, { p1: "(5, 9)", p2: "(17, -3)", p0: "(6, 8)" }]));
			const result = trace.$generate(parsePath("(18,8),(18,5),(15,5),(15,-3),(23,-3),(23,0),(26,0),(26,8)"));

			expect(result.length).to.equal(1);
			expect(result[0]).to.deep.equal([
				{ x: 20, y: 8 },
				{ x: 131 / 7, y: 44 / 7 },
				{ x: 17, y: 5 },
				{ x: 15, y: 3.5 },
			]);
		});

		it("But should not end tracing if the said hinge hits the extension of an intersection ridge", function() {
			const trace = new Trace(Line.$parseTest([{ p1: "(18, 9)", p2: "(17, 11)" }, { p1: "(17, 11)", p2: "(11, 13)" }, { p1: "(11, 13)", p2: "(12, 11)" }, { p1: "(12, 11)", p2: "(18, 9)" }, { p1: "(18, 9)", p2: "(18, 9)" }, { p1: "(11, 13)", p2: "(11, 13)" }, { p1: "(19, 0)", p2: "(17, 8)" }, { p1: "(17, 8)", p2: "(12, 11)" }, { p1: "(12, 11)", p2: "(14, 3)" }, { p1: "(14, 3)", p2: "(19, 0)" }, { p1: "(19, 0)", p2: "(19, 0)" }, { p1: "(12, 11)", p2: "(12, 11)" }, { p1: "(17, 8)", p2: "(17, 8)", type: 3 }]), SlashDirection.BW, Line.$parseTest<SideDiagonal>([{ p1: "(18, 10)", p2: "(16, 12)", p0: "(17, 11)" }, { p1: "(9, 8)", p2: "(11, 6)", p0: "(14, 3)" }]));
			const result = trace.$generate(parsePath("(28,7),(28,9),(22,9),(22,11),(16,11),(16,9),(10,9),(10,7),(-2,7),(-2,-7),(10,-7),(10,-9),(28,-9),(28,-7),(40,-7),(40,7)"));

			expect(result.length).to.equal(1);
			expect(result[0]).to.deep.equal([
				{ x: 17, y: 11 },
				{ x: 16, y: 29 / 3 },
				{ x: 16, y: 8.6 },
				{ x: 13, y: 7 },
				{ x: 10, y: 7 },
			]);
		});

		it("Should discard paths with just one point, but that won't end the tracing", function() {
			const trace = new Trace(Line.$parseTest([{ p1: "(0, 27)", p2: "(1, 25)" }, { p1: "(1, 25)", p2: "(29/2, 11/2)" }, { p1: "(29/2, 11/2)", p2: "(17, 18)" }, { p1: "(17, 18)", p2: "(26, 15)" }, { p1: "(26, 15)", p2: "(24, 19)" }, { p1: "(24, 19)", p2: "(0, 27)" }, { p1: "(3, 11)", p2: "(15, 2)" }, { p1: "(15, 2)", p2: "(29/2, 11/2)" }, { p1: "(1, 25)", p2: "(3, 11)" }, { p1: "(17, 18)", p2: "(18, 10)" }, { p1: "(18, 10)", p2: "(29/2, 11/2)" }, { p1: "(0, 27)", p2: "(0, 27)" }, { p1: "(26, 15)", p2: "(26, 15)" }, { p1: "(15, 2)", p2: "(15, 2)" }, { p1: "(18, 10)", p2: "(24, 4)", type: 3 }]), SlashDirection.BW, Line.$parseTest<SideDiagonal>([{ p1: "(27, 16)", p2: "(14, 29)", p0: "(24, 19)" }, { p1: "(1, 13)", p2: "(13, 1)", p0: "(3, 11)" }]));
			const result = trace.$generate(parsePath("(18,23),(18,10),(7,10),(7,-6),(23,-6),(23,7),(34,7),(34,23)"));

			expect(result.length).to.equal(1);
			expect(result[0]).to.deep.equal([
				{ x: 20, y: 23 },
				{ x: 20, y: 61 / 3 },
				{ x: 18, y: 53 / 3 },
				{ x: 18, y: 10 },
				{ x: 182 / 11, y: 173 / 11 },
				{ x: 11.8, y: 9.4 },
				{ x: 7, y: 8 },
			]);
		});

	});

});
