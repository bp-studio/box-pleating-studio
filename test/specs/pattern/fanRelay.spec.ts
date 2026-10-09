import { describe, it, expect } from "@rstest/core";

import { expectFan, expectWithinFlapRectangles, findFan, forEachFan } from "./fanUtil";
import { node, parseTree } from "@utils/tree";
import { same } from "shared/types/geometry";

describe("Four flap patterns", () => {

	describe("Fans with relays", () => {

		it("Relays the middle onto the relayed side", () => {
			// Only the narrowest overlap (1x8) is kept. The widest one (9x1)
			// is relayed onto it, leaving 8x1, and the middle one (4x3) is
			// relayed onto the side corner of that, leaving 3x2.
			const fan = [[0, 0, 14], [6, 14, 1], [11, 12, 1], [14, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("- R Rm", 2);

				// The kept gadget
				expect(ridges).to.containLine([pt(0, 0), pt(12, 4)]);
				expect(ridges).to.containLine([pt(0, 0), pt(1, 2)]);

				// The outer one is relayed onto the side corner of the kept one
				expect(ridges).to.containLine([pt(1, 2), pt(4, 4)]);
				expect(ridges).to.containLine([pt(1, 2), pt(3, 12)]);

				// The middle one is relayed onto the side corner of that
				expect(ridges).to.containLine([pt(4, 4), pt(5, 5)]);
			});
		});

		it("Pushes nested relays outwards from the ends of the chains", () => {
			// The outer one (C, 7x2) is relayed onto the kept one, and the
			// middle one (B, 1x5 after cutting) onto it. Previously, C was
			// pushed outwards without leaving room for B. Also, the offset of B
			// is relative to C, so the movement of C must be excluded.
			// Otherwise, B goes beyond its flap.
			const fan = [[0, 0, 17], [11, 16, 1], [16, 11, 1], [17, 6, 1]];
			forEachFan(fan, () => {
				const config = findFan("- R RHm", 8, 3);
				expectWithinFlapRectangles(config);
			});
		});

		it("Relays a perfect join", () => {
			// The two wider overlaps are cut by the narrowest one (1x5), and
			// joined perfectly at its side corner.
			const fan = [[0, 0, 9], [5, 9, 1], [7, 8, 1], [9, 6, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("- J(-+P)");

				// The kept gadget
				expect(ridges).to.containLine([pt(0, 0), pt(1, 2)]);

				// The join starts at the side corner of the kept gadget
				expect(ridges).to.containLine([pt(1, 2), pt(5, 4)]);
				expect(ridges).to.containLine([pt(1, 2), pt(3, 8)]);
				expect(ridges).to.not.containLine([pt(1, 2), pt(4, 6)]);
			});
		});

		it("Relays a simple join", () => {
			// The widest one is kept here, and the join cannot reach its side
			// corner, as both joined gadgets are already at their flaps.
			const fan = [[0, 0, 10], [5, 10, 1], [7, 9, 1], [10, 6, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("- J(-+S)");

				// The kept gadget
				expect(ridges).to.containLine([pt(0, 0), pt(2, 1)]);

				// The join
				const i = pt(11 / 2, 9 / 2);
				expect(ridges).to.containLine([pt(2, 1), pt(3, 2)]);
				expect(ridges).to.containLine([pt(3, 2), i]);
				expect(ridges).to.containLine([pt(3, 2), pt(5, 8)]);
				expect(ridges).to.containLine([pt(3, 2), pt(9, 4)]);
			});
		});

		it("Relays a base join with a half-integral gadget", () => {
			const fan = [[0, 0, 12], [8, 11, 1], [11, 8, 1], [12, 5, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("- J(-H+B)");

				// The kept gadget
				expect(ridges).to.containLine([pt(0, 0), pt(2, 3)]);

				// The base join starts at the side corner of the kept gadget
				expect(ridges).to.containLine([pt(2, 3), pt(7, 8)]);
				expect(ridges).to.containLine([pt(7, 8), pt(6, 6)]);
				expect(ridges).to.containLine([pt(6, 6), pt(21 / 2, 15 / 2)]);
				expect(ridges).to.containLine([pt(2, 3), pt(4, 9)]);
			});
		});

		it("Fits all gadgets of a relayed join in their flap rectangles", () => {
			// Previously, only the first gadget of the relayed join was pushed
			// to its flap, so that the other one went beyond its flap, and the
			// join was one unit away from the kept gadget.
			const fan = [[0, 0, 14], [6, 14, 1], [11, 11, 1], [14, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("- J(-+S)");

				// The join starts at the side corner of the kept gadget
				expect(ridges).to.containLine([pt(0, 0), pt(1, 2)]);
				expect(ridges).to.containLine([pt(1, 2), pt(8, 5)]);
				expect(ridges).to.containLine([pt(1, 2), pt(3, 12)]);
				expect(ridges).to.not.containLine([pt(1, 2), pt(2, 3)]);

				// One of the joined gadgets reaches its flap
				expect(ridges).to.containLine([pt(3, 12), pt(6, 14)]);
				expect(ridges).to.containLine([pt(10, 10), pt(11, 11)]);
			});
		});

		it("Relays one side and joins the other side perfectly", () => {
			// This layout also admits a perfect join and a simple join,
			// but relays are preferred.
			const fan = [[0, 0, 10], [5, 10, 1], [7, 9, 1], [10, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+P R");

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 7)]);
				expect(ridges).to.containLine([pt(4, 7), pt(6, 9)]);

				// The relay connects to the middle gadget
				expect(ridges).to.containLine([pt(6, 4), pt(4, 2)]);
			});
		});

		it("Relays one side and joins the other side simply", () => {
			const fan = [[0, 0, 10], [5, 10, 1], [9, 8, 1], [11, 5, 2]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+S R");

				// The simple join
				expect(ridges).to.containLine([pt(0, 0), pt(13 / 3, 16 / 3)]);
				expect(ridges).to.containLine([pt(13 / 3, 16 / 3), pt(8, 9)]);

				// The relayed gadget starts at the corner of the middle gadget
				expect(ridges).to.containLine([pt(9, 2), pt(4, 1)]);
			});
		});

		it("Relays both sides", () => {
			const fan = [[0, 0, 9], [5, 9, 1], [7, 8, 1], [8, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("- R R");

				// The middle gadget
				expect(ridges).to.containLine([pt(0, 0), pt(5, 3)]);
				expect(ridges).to.containLine([pt(0, 0), pt(1, 4)]);

				// The relays connect to the two corners of the middle gadget
				expect(ridges).to.containLine([pt(5, 3), pt(6, 6)]);
				expect(ridges).to.containLine([pt(2, 5), pt(1, 4)]);
			});
		});

		it("Relays one side and joins the other side with a base join", () => {
			const fan = [[0, 0, 9], [5, 9, 1], [7, 8, 1], [8, 6, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+B R");

				// The base join
				expect(ridges).to.containLine([pt(0, 0), pt(6, 7)]);
				expect(ridges).to.containLine([pt(6, 7), pt(5, 5)]);
				expect(ridges).to.containLine([pt(5, 5), pt(8, 6)]);

				// The relay connects to the joined gadgets
				expect(ridges).to.containLine([pt(1, 4), pt(2, 5)]);
			});
		});

		it("Relays one side with a half-integral gadget", () => {
			// Joining all three with half-integral gadgets, and relaying a join
			// onto a half-integral gadget, are of the same rank
			const fan = [[0, 0, 10], [6, 10, 1], [7, 9, 1], [9, 7, 1]];
			forEachFan(fan, pt => {
				// The two patterns are the two orientations of the gadget
				const ridges = expectFan("-+P RH", 2, 4);

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(5, 5)]);
				expect(ridges).to.containLine([pt(5, 5), pt(6, 8)]);
				expect(ridges).to.containLine([pt(5, 5), pt(9, 7)]);

				// The two orientations of the relayed gadget
				expect(ridges).to.containLine([pt(2, 6), pt(3, 7)]);
				expect(ridges).to.containLine([pt(2, 6), pt(7 / 2, 15 / 2)]);
			});
		});

		it("Relays both sides with a half-integral gadget", () => {
			const fan = [[0, 0, 11], [5, 11, 1], [9, 10, 1], [11, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("- R RH", 2, 2);

				// The middle gadget
				expect(ridges).to.containLine([pt(0, 0), pt(5, 3)]);
				expect(ridges).to.containLine([pt(0, 0), pt(1, 4)]);

				// The relays
				expect(ridges).to.containLine([pt(5, 3), pt(8, 4)]);
				expect(ridges).to.containLine([pt(5, 3), pt(6, 5)]);
				expect(ridges).to.containLine([pt(1, 4), pt(4, 6)]);
				expect(ridges).to.containLine([pt(1, 4), pt(2, 9)]);
			});
		});

		it("Relays one side with a universal gadget", () => {
			const fan = [[0, 0, 11], [5, 11, 1], [8, 10, 1], [9, 8, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+B RU");

				// The base join
				expect(ridges).to.containLine([pt(7, 9), pt(6, 7)]);
				expect(ridges).to.containLine([pt(6, 7), pt(9, 8)]);

				// The relayed gadget touches the joined one at its slack
				const s = pt(3 / 2, 11 / 2);
				expect(ridges).to.containLine([pt(1, 5), s]);
				expect(ridges).to.containLine([s, pt(5, 11)]);
			});
		});

		it("Relays the middle with a half-integral gadget onto a base join", () => {
			// In both orientations of the half-integral gadget, the slack
			// lies at the connection or at the outer end. Previously, the
			// collision test ignored the anchor of the relayed gadget not being
			// at its origin (as in reversed GPS), so that an overlapping
			// pattern of a lower rank was found in some of the transformations.
			// (The original layout of this test now finds a relayed join.)
			const fan = [[0, 0, 15], [15, 8, 2], [10, 15, 2], [13, 11, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+B RHm", 2);

				// The base join
				expect(ridges).to.containLine([pt(5, 5), pt(11, 7)]);
				expect(ridges).to.containLine([pt(5, 5), pt(10, 15)]);

				// The two orientations of the relayed gadget
				expect(ridges).to.containLine([pt(5, 5), pt(7, 7)]);
				expect(ridges).to.containLine([pt(5, 5), pt(15 / 2, 15 / 2)]);
			});
		});

		it("Relays both sides onto a half-integral gadget", () => {
			// The relayed parts of the outer ones are of odd area, so that
			// relaying the middle one onto the relayed side is not preferred.
			const fan = [[0, 0, 12], [6, 12, 1], [9, 11, 2], [12, 8, 2]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-H R R");

				// The middle gadget, with the slack at the joint
				const s = pt(1 / 2, 1 / 2);
				expect(ridges).to.containLine([pt(0, 0), s]);
				expect(ridges).to.containLine([s, pt(3, 8)]);
				expect(ridges).to.containLine([s, pt(5, 2)]);

				// The relays
				expect(ridges).to.containLine([pt(5, 2), pt(9, 3)]);
				expect(ridges).to.containLine([pt(3, 8), pt(4, 11)]);
			});
		});

		it("Relays both sides onto a universal gadget", () => {
			const fan = [[0, 0, 10], [7, 9, 1], [9, 9, 2], [11, 5, 2]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-U R R");

				// The middle gadget consists of two pieces
				expect(ridges).to.containLine([pt(0, 0), pt(17 / 2, 17 / 2)]);

				// The relays
				expect(ridges).to.containLine([pt(4, 1), pt(9, 2)]);
				expect(ridges).to.containLine([pt(4, 1), pt(6, 4)]);
				expect(ridges).to.containLine([pt(1, 4), pt(3, 6)]);
			});
		});

		it("Relays the middle onto a perfect join", () => {
			// There's also a relayed join of the same rank
			const fan = [[0, 0, 12], [7, 12, 1], [10, 10, 1], [11, 8, 1]];
			forEachFan(fan, (pt, ids) => {
				const ridges = expectFan("-+P Rm", 1, 2);

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(3, 4)]);
				expect(ridges).to.containLine([pt(3, 4), pt(11, 8)]);
				expect(ridges).to.containLine([pt(3, 4), pt(5, 10)]);

				// The middle gadget connects to the concave corner of the join
				expect(ridges).to.containLine([pt(3, 4), pt(6, 7)]);
				expect(ridges).to.containLine([pt(6, 7), pt(9, 8)]);
				expect(ridges).to.containLine([pt(6, 7), pt(7, 9)]);

				// The contour of the middle flap is traced through the gadget
				const path = node(ids[1])!.$graphics.$contours[0].outer;
				for(const p of [pt(9, 29 / 3), pt(19 / 2, 9)]) {
					expect(path.some(q => same(q, p))).to.be.true;
				}
			});
		});

		it("Relays the middle onto a simple join", () => {
			const fan = [[0, 0, 12], [5, 12, 1], [10, 10, 1], [11, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+S Rm");

				// The simple join
				const i = pt(7 / 2, 9 / 2);
				expect(ridges).to.containLine([pt(0, 0), i]);
				expect(ridges).to.containLine([i, pt(11, 7)]);
				expect(ridges).to.containLine([i, pt(5, 12)]);

				// The middle gadget connects to the concave corner of the join
				expect(ridges).to.containLine([i, pt(6, 7)]);
			});
		});

		it("Relays the middle onto a base join", () => {
			const fan = [[0, 0, 12], [5, 12, 1], [10, 12, 3], [11, 8, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+B Rm", 2);

				// The base join
				expect(ridges).to.containLine([pt(0, 0), pt(4, 7)]);
				expect(ridges).to.containLine([pt(4, 7), pt(3, 4)]);
				expect(ridges).to.containLine([pt(3, 4), pt(11, 8)]);

				// The middle gadget connects to the concave corner of the join
				expect(ridges).to.containLine([pt(3, 4), pt(4, 5)]);
			});
		});

		it("Relays the middle onto a join of half-integral gadgets", () => {
			// Both outer overlaps (1x13 and 7x1) are of odd area. There are
			// also other configurations of the same rank.
			const fan = [[0, 0, 19], [21, 9, 3], [19, 12, 3], [13, 19, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-H+SH Rm", 1, 6);

				// The simple join
				const i = pt(5 / 2, 5 / 2);
				expect(ridges).to.containLine([pt(0, 0), i]);
				expect(ridges).to.containLine([i, pt(41 / 2, 17 / 2)]);
				expect(ridges).to.containLine([i, pt(11 / 2, 23 / 2)]);

				// The middle gadget connects to the concave corner of the join
				expect(ridges).to.containLine([i, pt(4, 4)]);
				expect(ridges).to.containLine([pt(4, 4), pt(7, 9)]);
				expect(ridges).to.containLine([pt(4, 4), pt(16, 7)]);
			});
		});

		it("Relays the middle with a half-integral gadget", () => {
			// The remaining part of the middle overlap is 1x1
			const fan = [[0, 0, 12], [7, 11, 1], [10, 10, 1], [11, 8, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+P RHm", 2);

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(5, 5)]);
				expect(ridges).to.containLine([pt(5, 5), pt(11, 8)]);
				expect(ridges).to.containLine([pt(5, 5), pt(7, 11)]);

				// The two orientations of the half-integral gadget
				expect(ridges).to.containLine([pt(5, 5), pt(15 / 2, 15 / 2)]);
				expect(ridges).to.containLine([pt(5, 5), pt(7, 7)]);
			});
		});

		it("Relays the middle with a half-integral gadget onto a simple join", () => {
			// The remaining part of the middle overlap is 3x1
			const fan = [[0, 0, 12], [5, 12, 1], [8, 11, 1], [11, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+S RHm", 2);

				// The simple join
				const i = pt(7 / 2, 9 / 2);
				expect(ridges).to.containLine([pt(0, 0), i]);
				expect(ridges).to.containLine([i, pt(11, 7)]);
				expect(ridges).to.containLine([i, pt(5, 12)]);

				// The two orientations of the half-integral gadget
				expect(ridges).to.containLine([i, pt(9 / 2, 11 / 2)]);
				expect(ridges).to.containLine([i, pt(4, 5)]);
			});
		});

		it("Relays the middle with a half-integral gadget onto a join of half-integral gadgets", () => {
			// All of the outer overlaps (7x3 and 3x7) and the remaining part of
			// the middle one (3x1) are of odd area
			const fan = [[0, 0, 16], [10, 14, 1], [14, 10, 1], [12, 14, 2]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-H+SH RHm", 2, 8);

				// The simple join
				const i = pt(15 / 2, 15 / 2);
				expect(ridges).to.containLine([pt(0, 0), i]);
				expect(ridges).to.containLine([i, pt(27 / 2, 19 / 2)]);
				expect(ridges).to.containLine([i, pt(19 / 2, 27 / 2)]);

				// The two orientations of the half-integral gadget
				expect(ridges).to.containLine([i, pt(8, 8)]);
				expect(ridges).to.containLine([i, pt(17 / 2, 17 / 2)]);
			});
		});

	});

	it("Does not join overlaps nested with a common side", () => {
		// At the joint of flap 31, the overlap 31-46 (1x7) is nested in both
		// 31-70 (1x13, the same width) and 2-31 (17x7, the same height).
		// These can be relayed, but cannot be joined. Previously, the fan join
		// crashed on the joiners of such pairs.
		expect(() => parseTree(
			"(5,76,1),(5,31,11),(5,46,5),(76,89,3),(89,72,2),(89,73,6)," +
			"(72,67,2),(73,70,5),(67,2,23)",
			"(46,62,74,0,0),(31,77,65,0,0),(70,52,78,0,0),(2,52,100,0,0)"
		)).to.not.throw();
	});

});
