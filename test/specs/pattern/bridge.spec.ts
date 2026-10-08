import { describe, it, expect } from "@rstest/core";

import { expectRepo } from "./util";
import { node, parseTree } from "@utils/tree";
import { toPath } from "core/math/geometry/rationalPath";
import { LayoutController } from "core/controller/layoutController";
import { DesignController } from "core/controller/designController";
import { State, fullReset } from "core/service/state";
import { Migration } from "client/patches";

import type { Configuration } from "core/design/layout/configuration";
import type { Device } from "core/design/layout/pattern/device";
import type { JEdge, JFlap } from "shared/json";

/** The sizes of the overlaps in each partition, as in `"2:2x1"`. */
function describePartitions(config: Configuration): string[][] {
	return config.$partitions.map(p =>
		p.$overlaps.map(o => `${o.parent}:${o.ox}x${o.oy}`)
	);
}

function anchors(device: Device): string {
	return device.$anchors[0].map(p => p.toString()).join(",");
}

function patternContours(id: number): IPoint[][] {
	return node(id)!.$graphics.$patternContours.map(c => toPath(c));
}

describe("Bridged joints", () => {

	it("Relays nested overlaps with a common side at both ends", () => {
		// The junction 1-2 (4x4) is nested at both ends: at flap 1 with 1-3
		// (2x4, the same height), and at flap 2 with 2-3 (4x2, the same
		// width). It is cut at both ends, leaving 2x2 relayed at both ends.
		parseTree(
			"(0,1,10),(0,2,10),(0,3,1)",
			"(1,0,0,0,0),(2,16,16,0,0),(3,9,7,0,0)"
		);
		const [config] = expectRepo("1,2,3", 1);
		expect(describePartitions(config)).to.eql([["0:2x2"], ["1:2x4"], ["2:4x2"]]);
		expect(config.$patterns.length).to.equal(6);
		const devices = config.$patterns[0].$devices;
		expect(anchors(devices[0])).to.equal("(4, 6),(5, 9),(9, 11),(8, 8)");

		const [f1] = patternContours(1);
		expect(f1).to.equalPath("(8,6),(8,8),(6,9.5),(6,10)");
		const [f2] = patternContours(2);
		expect(f2).to.equalPath("(6,9.5),(8,8),(10,8)");
	});

	it("Skips the plans where the relays at both ends overlap", () => {
		// Flap 1 lies between flaps 2 and 3, so the junction 2-3 (4x2) is cut
		// by 1-2 (3x2) at flap 2 and by 1-3 (3x2) at flap 3, leaving nothing.
		expect(() => parseTree(
			"(0,4,1),(4,1,1),(4,2,8),(0,3,7)",
			"(1,0,0,0,0),(2,6,-7,0,0),(3,-6,7,0,0)"
		)).to.not.throw();
	});

	it("Bridges a fan to another joint", () => {
		// The fan at flap 3 uses the nested relay with flap 5 kept; the
		// junction 3-8 is also nested with 5-8 (the same width) at flap 8.
		// So 3-8 (6x6) is cut by 3-5 and 3-6' at flap 3, and by 5-8 at flap
		// 8, leaving 2x1 relayed at both ends.
		parseTree(
			"(0,1,3),(0,2,6),(0,7,6),(0,5,2),(1,3,15),(1,4,9),(2,6,3),(2,8,6)",
			"(3,24,24,0,0),(4,0,24,0,0),(6,9,0,0,0),(8,0,0,0,0),(7,24,0,0,0),(5,8,12,0,0)"
		);
		const [config] = expectRepo("3,5,6,8", 1);
		expect(describePartitions(config)).to.eql([
			["0:4x8"], ["1:8x3"], ["2:2x1"], ["3:6x2"],
		]);
		expect(config.$patterns.length).to.equal(8);

		// The bridge is in the middle of its dragging range
		const bridge = config.$patterns[0].$devices[2];
		expect(anchors(bridge)).to.equal("(10, 9),(9, 6),(7, 5),(8, 8)");
		expect(bridge.$getDraggingRange()).to.eql([-3, 3]);

		// The contour of flap 8 goes around the gadget of 5-8, which lies
		// within the range of its quadrant.
		const [f8] = patternContours(8);
		expect(f8).to.equalPath("(6,4),(14/3,4),(2,6)");
		const [f3] = patternContours(3);
		expect(f3).to.equalPath("(21/2,17),(13,41/3),(13,12),(17,9)");
	});

	it("Renders the bridge at the end of its range", () => {
		// The intersection anchor of the bridge towards flap 5 goes past the
		// corner (10,10) of flap 5, and the intersection ridge reaches the
		// corner from the other side.
		parseTree(
			"(0,1,3),(0,2,6),(0,7,6),(0,5,2),(1,3,15),(1,4,9),(2,6,3),(2,8,6)",
			"(3,24,24,0,0),(4,0,24,0,0),(6,9,0,0,0),(8,0,0,0,0),(7,24,0,0,0),(5,8,12,0,0)"
		);
		const repo = State.$stretches.get("3,5,6,8")!.$repo;
		const { x, y } = repo.$pattern!.$devices[2].$location;
		LayoutController.moveDevice("3,5,6,8", 2, { x: x + 3, y: y + 3 });
		const bridge = repo.$pattern!.$devices[2];
		expect(anchors(bridge)).to.equal("(13, 12),(12, 9),(10, 8),(11, 11)");
		expect(bridge.$getDraggingRange()).to.eql([-6, 0]);
		expect(patternContours(5).length).to.equal(3);
	});

	it("Keeps the dragging range of a bridge loaded at the end of its range", () => {
		const edges = "(0,1,3),(0,2,6),(0,7,6),(0,5,2),(1,3,15),(1,4,9),(2,6,3),(2,8,6)";
		const flaps = "(3,24,24,0,0),(4,0,24,0,0),(6,9,0,0,0),(8,0,0,0,0),(7,24,0,0,0),(5,8,12,0,0)";
		parseTree(edges, flaps);
		const { x, y } = State.$stretches.get("3,5,6,8")!.$repo.$pattern!.$devices[2].$location;
		LayoutController.moveDevice("3,5,6,8", 2, { x: x + 3, y: y + 3 });
		const { id, configuration, pattern } = State.$stretches.get("3,5,6,8")!.toJSON();

		// Save the stretch as in a project file
		const project = Migration.$getSample();
		project.design.tree.edges = edges.slice(1, -1).split("),(").map(e => {
			const [n1, n2, length] = e.split(",").map(Number);
			return { n1, n2, length } as JEdge;
		});
		project.design.layout.flaps = flaps.slice(1, -1).split("),(").map(f => {
			const [i, fx, fy] = f.split(",").map(Number);
			return { id: i, x: fx, y: fy, width: 0, height: 0 } as JFlap;
		});
		project.design.layout.stretches = [{ id, configuration, pattern }];
		fullReset();
		DesignController.init(project.design);

		const bridge = State.$stretches.get("3,5,6,8")!.$repo.$pattern!.$devices[2];
		expect(anchors(bridge)).to.equal("(13, 12),(12, 9),(10, 8),(11, 11)");
		expect(bridge.$getDraggingRange()).to.eql([-6, 0]);
		expect(patternContours(5).length).to.equal(3);
	});

	it("Traces the contour of a small flap with overlaps spanning its sides", () => {
		// Flap 3 has radius 1, and both overlaps 1-3 (2x4) and 2-3 (4x2) span
		// its whole sides. In the second pattern, the gadget of 2-3 starts
		// from the tip of flap 3, carving its upper right corner.
		parseTree(
			"(0,1,10),(0,2,10),(0,3,1)",
			"(1,0,0,0,0),(2,16,16,0,0),(3,9,7,0,0)"
		);
		for(const [index, path] of [
			[1, "(10,22/3),(19/2,8)"],
			[2, "(10,23/3),(46/5,8)"],
		] as const) {
			LayoutController.completeStretch("1,2,3");
			LayoutController.switchPattern("1,2,3", index);
			const [f3] = patternContours(3);
			expect(f3).to.equalPath(path);
		}
	});

});
