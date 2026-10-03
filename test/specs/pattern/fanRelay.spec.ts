import { describe, it, expect } from "@rstest/core";

import { expectFan, forEachFan } from "./fanUtil";
import { node } from "@utils/tree";
import { same } from "shared/types/geometry";

describe("Four flap patterns", () => {

	describe("Fans with relays", () => {

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
			const fan = [[0, 0, 9], [5, 9, 1], [7, 8, 1], [9, 6, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("- R R");

				// The middle gadget
				expect(ridges).to.containLine([pt(0, 0), pt(5, 3)]);
				expect(ridges).to.containLine([pt(0, 0), pt(1, 4)]);

				// The relays connect to the two corners of the middle gadget
				expect(ridges).to.containLine([pt(8, 4), pt(5, 3)]);
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
			// Joining all three with half-integral gadgets is of the same rank
			const fan = [[0, 0, 10], [5, 10, 1], [7, 9, 1], [10, 6, 1]];
			forEachFan(fan, pt => {
				// The two patterns are the two orientations of the gadget
				const ridges = expectFan("-+P RH", 2, 2);

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 7)]);
				expect(ridges).to.containLine([pt(4, 7), pt(6, 9)]);

				// The relayed gadget, with the small piece at the outer end
				expect(ridges).to.containLine([pt(4, 2), pt(7, 3)]);
				expect(ridges).to.containLine([pt(4, 2), pt(5, 4)]);
				expect(ridges).to.containLine([pt(19 / 2, 11 / 2), pt(9, 4)]);
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
			const fan = [[0, 0, 12], [8, 11, 1], [11, 8, 1], [12, 5, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+B RHm", 2);

				// The base join
				expect(ridges).to.containLine([pt(4, 3), pt(7, 4)]);
				expect(ridges).to.containLine([pt(4, 3), pt(8, 11)]);

				// The two orientations of the relayed gadget
				expect(ridges).to.containLine([pt(4, 3), pt(5, 4)]);
				expect(ridges).to.containLine([pt(4, 3), pt(11 / 2, 9 / 2)]);
			});
		});

		it("Relays both sides onto a half-integral gadget", () => {
			const fan = [[0, 0, 12], [6, 12, 1], [9, 11, 2], [11, 8, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-H R R", 2);

				// The middle gadget, with the slack at the joint
				const s = pt(1 / 2, 1 / 2);
				expect(ridges).to.containLine([pt(0, 0), s]);
				expect(ridges).to.containLine([s, pt(3, 8)]);
				expect(ridges).to.containLine([s, pt(5, 2)]);

				// The relays
				expect(ridges).to.containLine([pt(5, 2), pt(6, 3)]);
				expect(ridges).to.containLine([pt(3, 8), pt(4, 11)]);
			});
		});

		it("Relays both sides onto a universal gadget", () => {
			const fan = [[0, 0, 10], [6, 10, 1], [9, 9, 2], [11, 5, 2]];
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
			const fan = [[0, 0, 12], [7, 12, 1], [10, 10, 1], [11, 8, 1]];
			forEachFan(fan, (pt, ids) => {
				const ridges = expectFan("-+P Rm");

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
			const fan = [[0, 0, 12], [5, 12, 1], [10, 10, 1], [11, 8, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-+B Rm");

				// The base join
				expect(ridges).to.containLine([pt(0, 0), pt(4, 7)]);
				expect(ridges).to.containLine([pt(4, 7), pt(3, 4)]);
				expect(ridges).to.containLine([pt(3, 4), pt(11, 8)]);

				// The middle gadget connects to the concave corner of the join
				expect(ridges).to.containLine([pt(3, 4), pt(6, 7)]);
			});
		});

		it("Relays the middle onto a join of half-integral gadgets", () => {
			// Both outer overlaps (5x1 and 1x5) are of odd area
			// There's also a configuration of the same rank relaying one side
			const fan = [[0, 0, 9], [5, 9, 1], [7, 8, 1], [9, 5, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-H+SH Rm", 1, 2);

				// The simple join
				const i = pt(5 / 2, 5 / 2);
				expect(ridges).to.containLine([pt(0, 0), i]);
				expect(ridges).to.containLine([i, pt(17 / 2, 9 / 2)]);
				expect(ridges).to.containLine([i, pt(9 / 2, 17 / 2)]);

				// The middle gadget connects to the concave corner of the join
				expect(ridges).to.containLine([i, pt(4, 4)]);
				expect(ridges).to.containLine([pt(4, 4), pt(6, 5)]);
				expect(ridges).to.containLine([pt(4, 4), pt(5, 7)]);
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
			// All of the outer overlaps (5x1 and 1x5) and the remaining part of
			// the middle one (1x1) are of odd area
			const fan = [[0, 0, 9], [5, 9, 1], [8, 8, 1], [9, 5, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan("-H+SH RHm", 2, 5);

				// The simple join
				const i = pt(5 / 2, 5 / 2);
				expect(ridges).to.containLine([pt(0, 0), i]);
				expect(ridges).to.containLine([i, pt(17 / 2, 9 / 2)]);
				expect(ridges).to.containLine([i, pt(9 / 2, 17 / 2)]);

				// The two orientations of the half-integral gadget
				expect(ridges).to.containLine([i, pt(11 / 2, 11 / 2)]);
				expect(ridges).to.containLine([i, pt(5, 5)]);
			});
		});

	});

});
