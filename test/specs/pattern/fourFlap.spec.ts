import { describe, it, expect } from "@rstest/core";

import { expectRepo, generateFromFlaps } from "./util";
import { node } from "@utils/tree";
import { same } from "shared/types/geometry";
import { JoinStrategy } from "shared/json";

import type { ILine } from "shared/types/geometry";

type Transform = (x: number, y: number) => IPoint;

const { perfect: P, simple: S } = JoinStrategy;

describe("Four flap patterns", () => {

	describe("Fans", () => {

		it("Joins three gadgets perfectly", () => {
			const fan = [[0, 0, 10], [5, 10, 1], [7, 9, 1], [9, 8, 1]];
			forEachFan(fan, (pt, a) => {
				const ridges = expectFan([P, P], false);

				// Ridges between the gadgets vanish
				expect(ridges).to.not.containLine([pt(0, 0), pt(5, 5)]);
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 7)]);

				// Intersection ridges
				expect(ridges).to.containLine([pt(5, 5), pt(8, 8)]);
				expect(ridges).to.containLine([pt(4, 7), pt(6, 9)]);

				// The contour of the flap is traced through the gadget
				const path = node(a)!.$graphics.$contours[0].outer;
				for(const p of [pt(4, 19 / 2), pt(14 / 3, 9)]) {
					expect(path.some(q => same(q, p))).to.be.true;
				}
			});
		});

		it("Joins three gadgets with a perfect join and a simple join", () => {
			const fan = [[0, 0, 10], [5, 10, 1], [8, 9, 1], [10, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan([P, S], false);

				// The perfect join
				expect(ridges).to.not.containLine([pt(0, 0), pt(4, 3)]);
				expect(ridges).to.containLine([pt(4, 3), pt(9, 8)]);

				// The simple join
				expect(ridges).to.containLine([pt(0, 0), pt(9 / 2, 13 / 2)]);
				expect(ridges).to.containLine([pt(9 / 2, 13 / 2), pt(7, 9)]);
			});
		});

		it("Joins three gadgets with two simple joins", () => {
			const fan = [[0, 0, 11], [6, 11, 1], [9, 8, 1], [12, 5, 2]];
			forEachFan(fan, pt => {
				const ridges = expectFan([S, S], false);
				for(const [i, d] of [
					[pt(7, 4), pt(10, 7)],
					[pt(9 / 2, 13 / 2), pt(8, 10)],
				]) {
					expect(ridges).to.containLine([pt(0, 0), i]);
					expect(ridges).to.containLine([i, d]);
				}
			});
		});

		it("Relays one side and joins the other side perfectly", () => {
			// This layout also admits a perfect join and a simple join,
			// but relays are preferred.
			const fan = [[0, 0, 10], [5, 10, 1], [7, 9, 1], [10, 7, 1]];
			forEachFan(fan, pt => {
				const ridges = expectFan([P], true);

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
				const ridges = expectFan([S], true);

				// The simple join
				expect(ridges).to.containLine([pt(0, 0), pt(13 / 3, 16 / 3)]);
				expect(ridges).to.containLine([pt(13 / 3, 16 / 3), pt(8, 9)]);

				// The relayed gadget starts at the corner of the middle gadget
				expect(ridges).to.containLine([pt(9, 2), pt(4, 1)]);
			});
		});

	});

});

/**
 * Generate the given fan of flaps under all transformations, by scaling (s)
 * and transposing (t), and with all orderings of the ids of the outer flaps.
 * The first flap is the one shared by all junctions.
 *
 * @param callback Called with the transformation and the id of the first
 * outer flap.
 */
function forEachFan(
	flaps: number[][], callback: (pt: Transform, a: number) => void
): void {
	const [center, ...outer] = flaps;
	for(const s of [1, -1]) {
		for(const t of [false, true]) {
			const pt: Transform = (x, y) =>
				t ? { x: y * s, y: x * s } : { x: x * s, y: y * s };
			for(const ids of THREE_PERMUTATION) {
				generateFromFlaps([
					{ id: 4, ...pt(center[0], center[1]), radius: center[2] },
					...outer.map(([x, y, radius], i) =>
						({ id: ids[i], ...pt(x, y), radius })
					),
				]);
				callback(pt, ids[0]);
			}
		}
	}
}

/**
 * Expect a fan with exactly one {@link Configuration} and one
 * {@link Pattern}, consisting of the given joins (in any ordering), and
 * whether one of the outer junctions is relayed.
 *
 * @returns All ridges of the {@link Pattern}.
 */
function expectFan(joins: JoinStrategy[], relayed: boolean): ILine[] {
	const [config] = expectRepo("1,2,3,4", 1);
	const [join, ...others] = config.$partitions.map(p => p.toJSON());
	const strategies = join.overlaps.map(o => o.join).filter(j => j);
	expect(strategies).to.have.members(joins);
	expect(others.length).to.equal(relayed ? 1 : 0);
	expect(config.$length).to.equal(1);
	return config.$pattern!.$devices.flatMap(d => d.$drawRidges);
}

const THREE_PERMUTATION = [
	[1, 2, 3],
	[1, 3, 2],
	[2, 1, 3],
	[2, 3, 1],
	[3, 1, 2],
	[3, 2, 1],
];
