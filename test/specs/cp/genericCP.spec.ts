import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { getJSON } from "@utils/sample";
import { fullReset, State } from "core/service/state";
import { Migration } from "client/patches";
import { DesignController } from "core/controller/designController";
import { getGenericCP } from "core/design/cp/genericCP";
import { CreaseType } from "shared/types/cp";
import { complete } from "../pattern/util";

import type { CPLine } from "shared/types/cp";
import type { Path } from "shared/types/geometry";

function rect(width: number, height: number): Path {
	return [
		{ x: 0, y: 0 }, { x: width, y: 0 },
		{ x: width, y: height }, { x: 0, y: height },
	];
}

function toKey(p: IPoint): string {
	return p.x + "," + p.y;
}

/** The tips of the flaps with zero width and height. */
function getPointTips(): Set<string> {
	const result = new Set<string>();
	for(const node of State.m.$tree.$nodes) {
		if(!node || !node.$parent || !node.$isLeaf) continue;
		const [t, r, b, l] = node.$AABB.$toValues();
		if(t == b && r == l) result.add(toKey({ x: r, y: t }));
	}
	return result;
}

/**
 * The interior vertices violating Maekawa's theorem, among those with all the
 * creases assigned. Also returns the number of vertices checked.
 */
function checkMaekawa(
	lines: readonly CPLine[], width: number, height: number
): [string[], number] {
	const stars = new Map<string, CreaseType[]>();
	for(const { p1, p2, type } of lines) {
		for(const p of [p1, p2]) {
			const key = toKey(p);
			const star = stars.get(key) ?? [];
			star.push(type);
			stars.set(key, star);
		}
	}
	const failures: string[] = [];
	let checked = 0;
	for(const [key, types] of stars) {
		const [x, y] = key.split(",").map(Number);
		if(x <= 0 || x >= width || y <= 0 || y >= height) continue;
		if(types.includes(CreaseType.Auxiliary)) continue;
		checked++;
		const m = types.filter(t => t == CreaseType.Mountain).length;
		const v = types.filter(t => t == CreaseType.Valley).length;
		if(Math.abs(m - v) != 2) failures.push(key);
	}
	return [failures, checked];
}

/** The types of the creases lying on the given segment. */
function typesOn(lines: readonly CPLine[], a: IPoint, b: IPoint): CreaseType[] {
	const on = (p: IPoint): boolean => {
		const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
		const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
		const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
		return cross == 0 && dot >= 0 && dot <= l2;
	};
	return lines.filter(l => on(l.p1) && on(l.p2)).map(l => l.type);
}

describe("Generic CP", () => {

	it("Violates Maekawa's theorem only at the tips", async () => {
		fullReset();
		const sample = await getJSON("v04.session.sample.json");
		DesignController.init(Migration.$process(sample).design);
		complete();
		const lines = getGenericCP(rect(42, 41));
		const [failures, checked] = checkMaekawa(lines, 42, 41);
		expect(checked).to.be.greaterThan(100);
		// The creases around the tips (of the middle flaps) are not adjusted in
		// the generic CP, so there are 4 valleys and 4 mountains at each tip.
		const tips = getPointTips();
		expect(failures.filter(key => !tips.has(key))).to.be.empty;
	});

	it("Assigns the ridges in GPS gadgets without axis-parallel creases", () => {
		parseTree(
			"(5,0,5),(5,3,2),(5,6,1),(0,1,2),(0,2,2),(3,4,1)",
			"(1,9,10,0,0),(2,6,7,0,0),(4,16,0,0,0),(6,1,15,0,0)"
		);
		complete();
		const lines = getGenericCP(rect(16, 16));

		// The kite of the GPS gadget between flaps 1 and 2. The four sides are
		// of the same type, and the diagonal is of the other type. Which is
		// which depends on the choice of the elevation zero.
		const kite = [
			{ x: 6.5, y: 7.5 }, { x: 8, y: 8 }, { x: 9, y: 10 }, { x: 7, y: 9 },
		];
		const next = (i: number): IPoint => kite[(i + 1) % kite.length];
		const sides = kite.flatMap((p, i) => typesOn(lines, p, next(i)));
		const diagonal = typesOn(lines, kite[0], kite[2]);
		expect(sides).to.have.length.greaterThan(3);
		expect(diagonal).to.have.length.greaterThan(0);
		const [side] = sides;
		expect([CreaseType.Mountain, CreaseType.Valley]).to.include(side);
		expect(sides.every(t => t == side)).to.be.true;
		expect(diagonal.every(t => t != side && t != CreaseType.Auxiliary))
			.to.be.true;
	});
});
