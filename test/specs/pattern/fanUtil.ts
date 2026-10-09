import { expect } from "@rstest/core";

import { expectRepo, generateFromFlaps } from "./util";
import { GadgetStrategy, JoinStrategy } from "shared/json";
import { State } from "core/service/state";

import type { ILine } from "shared/types/geometry";
import type { JOverlap, NodeId } from "shared/json";
import type { Device } from "core/design/layout/pattern/device";
import type { Configuration } from "core/design/layout/configuration";
import type { Pattern } from "core/design/layout/pattern/pattern";

export type Transform = (x: number, y: number) => IPoint;

/**
 * Generate the given fan of flaps under all transformations, by scaling (s)
 * and transposing (t), and with all orderings of the ids. The first flap is
 * the one shared by all junctions. Note that the ids decide the orientation of
 * the stretch, so the shared flap must take different ids to cover both cases.
 *
 * @param callback Called with the transformation and the ids of the outer
 * flaps.
 */
export function forEachFan(
	flaps: number[][], callback: (pt: Transform, ids: number[]) => void
): void {
	const [center, ...outer] = flaps;
	for(const s of [1, -1]) {
		for(const t of [false, true]) {
			const pt: Transform = (x, y) =>
				t ? { x: y * s, y: x * s } : { x: x * s, y: y * s };
			for(const [id, ...ids] of PERMUTATIONS) {
				generateFromFlaps([
					{ id, ...pt(center[0], center[1]), radius: center[2] },
					...outer.map(([x, y, radius], i) =>
						({ id: ids[i], ...pt(x, y), radius })
					),
				]);
				callback(pt, ids);
			}
		}
	}
}

/**
 * Expect a fan with the given number of {@link Configuration}s, one of which
 * has the given structure (see {@link describeFan}) and the given number of
 * {@link Pattern}s.
 *
 * @returns All ridges of all the {@link Pattern}s of that configuration.
 */
export function expectFan(
	structure: string, patterns = 1, configs = 1
): ILine[] {
	return getRidges(findFan(structure, patterns, configs));
}

/** Same as {@link expectFan}, but returns the {@link Configuration}. */
export function findFan(
	structure: string, patterns = 1, configs = 1
): Configuration {
	const all = expectRepo("1,2,3,4", configs);
	const config = all.find(c => describeFan(c) == structure);
	expect(config, all.map(describeFan).join(" / ")).to.exist;
	expect(config!.$length).to.equal(patterns);
	return config!;
}

/**
 * Expect every {@link Device} of every {@link Pattern} of the
 * {@link Configuration} to lie within the flap rectangles of its junctions.
 */
export function expectWithinFlapRectangles(config: Configuration): void {
	const junctions = config.$repo.$junctions;
	const tip = (id: number): IPoint =>
		State.m.$tree.$nodes[id as NodeId]!.$AABB.$points[0];
	for(const pattern of config.$patterns) {
		for(const device of pattern.$devices) {
			const rects = device.$partition.$overlaps.map(o => {
				const j = junctions[o.parent];
				const p1 = tip(j.c[0].e!), p2 = tip(j.c[2].e!);
				return {
					x1: Math.min(p1.x, p2.x), x2: Math.max(p1.x, p2.x),
					y1: Math.min(p1.y, p2.y), y2: Math.max(p1.y, p2.y),
				};
			});
			for(const { outer } of device.$contour) {
				for(const p of outer) {
					const inside = rects.some(r =>
						r.x1 <= p.x && p.x <= r.x2 && r.y1 <= p.y && p.y <= r.y2
					);
					expect(inside, `(${p.x},${p.y})`).to.be.true;
				}
			}
		}
	}
}

/** All ridges of all the {@link Pattern}s of a {@link Configuration}. */
export function getRidges(config: Configuration): ILine[] {
	return config.$patterns.flatMap(
		p => p.$devices.flatMap(d => d.$drawRidges)
	);
}

const JOIN_CODES = {
	[JoinStrategy.perfect]: "P",
	[JoinStrategy.simple]: "S",
	[JoinStrategy.baseJoin]: "B",
	[JoinStrategy.standardJoin]: "T",
};

const GADGET_CODES = {
	[GadgetStrategy.halfIntegral]: "H",
	[GadgetStrategy.universal]: "U",
};

/**
 * Describe the structure of a fan {@link Configuration}. The overlaps kept at
 * the joint are described by their joins (or "-" for the one being joined
 * onto) followed by their gadgets, and each of the relayed ones by "R",
 * followed by its gadget and "m" if it is the middle one. A relayed join is
 * described by "J" followed by its two overlaps in parentheses. Everything is
 * sorted so that the result is independent of the transformation.
 *
 * For example, "-H+SH Rm" means that the outer two are joined by a simple join
 * with half-integral gadgets, and the middle one is relayed onto the join.
 */
export function describeFan(config: Configuration): string {
	const [joined, ...relayed] = config.$partitions.map(p => p.$overlaps);
	const junctions = config.$repo.$junctions;
	const widths = junctions.map(j => j.ox).sort((a, b) => a - b);
	const gadget = (o: JOverlap): string =>
		o.gadget ? GADGET_CODES[o.gadget] : "";
	const isMiddle = (o: JOverlap): boolean =>
		junctions[o.parent].ox == widths[1];
	let kept = joined.map(o => (o.join ? JOIN_CODES[o.join] : "-") + gadget(o));
	if(!joined.some(isMiddle) && joined.length == 2) {
		// Which of the outer ones joins onto the other depends on the
		// transformation, so we attach the join to the gadgets in order.
		const join = JOIN_CODES[joined.find(o => o.join)!.join!];
		const [g1, g2] = joined.map(gadget).sort();
		kept = ["-" + g1, join + g2];
	}
	const relays = relayed.map(overlaps => {
		if(overlaps.length == 1) {
			const [o] = overlaps;
			return "R" + gadget(o) + (isMiddle(o) ? "m" : "");
		}
		// A relayed join
		const pair = overlaps.map(
			o => (o.join ? JOIN_CODES[o.join] : "-") + gadget(o)
		);
		return "J(" + pair.sort().join("+") + ")";
	});
	return [kept.sort().join("+"), ...relays.sort()].join(" ");
}

function permute(list: number[]): number[][] {
	if(list.length <= 1) return [list];
	return list.flatMap((x, i) => permute(list.toSpliced(i, 1)).map(
		p => [x, ...p]
	));
}

const PERMUTATIONS = permute([1, 2, 3, 4]);
