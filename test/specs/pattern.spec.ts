import { expect } from "chai";

import "../utils/line";
import { LayoutController } from "core/controller/layoutController";
import { DesignController } from "core/controller/designController";
import { Migration } from "client/patches";
import { toPath } from "core/math/geometry/rationalPath";
import { State, fullReset } from "core/service/state";
import { createTree, id2, id4, node, parseTree } from "../utils/tree";
import { TreeController } from "core/controller/treeController";
import * as sample from "../samples/v04.session.sample.json";

import type { Tree } from "core/design/context/tree";

describe("Pattern", function() {

	describe("Searching", function() {

		it("Loads saved patterns", function() {
			fullReset();
			const data = Migration.$process(sample);
			DesignController.init(data.design);
			complete();
			const stretch = State.$stretches.get("12,27")!;
			const device = stretch.$repo.$pattern!.$devices[0];
			expect(device.$offset).to.equal(4);
		});

		it("Signifies when no pattern is found", function() {
			generateFromFlaps([
				{ id: 1, x: 0, y: 0, radius: 10 },
				{ id: 2, x: 10, y: 11, radius: 3 },
				{ id: 3, x: 11, y: 5, radius: 2 },
			]);
			const stretch = State.$stretches.get("1,2,3")!;
			expect(stretch.$repo.$pattern).to.equal(null);
			expect(State.$updateResult.patternNotFound).to.be.true;
		});

		it("Caches repo during dragging", function() {
			parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
			LayoutController.completeStretch("1,2");

			const stretch = State.$stretches.get("1,2")!;
			expect(stretch.$isActive).to.be.true;
			const repo = stretch.$repo;
			expect(repo.$configurations.length).to.equal(1);
			const config = repo.$configuration!;
			expect(config.$length).to.equal(2);
			expect(config.$index).to.equal(0);

			LayoutController.switchPattern("1,2", 1);
			expect(config.$index).to.equal(1);

			LayoutController.updateFlap([{ id: id2, x: 8, y: 10, width: 0, height: 0 }], true, []);
			expect(stretch.$repo).to.not.equal(repo);

			LayoutController.updateFlap([{ id: id2, x: 8, y: 9, width: 0, height: 0 }], true, []);
			LayoutController.dragEnd();
			expect(stretch.$isActive).to.be.true;
			expect(stretch.$repo).to.equal(repo);
			expect(config.$index).to.equal(1);

			LayoutController.updateFlap([{ id: id2, x: 11, y: 9, width: 0, height: 0 }], true, []);
			expect(stretch.$isActive).to.be.false;

			LayoutController.updateFlap([{ id: id2, x: 8, y: 9, width: 0, height: 0 }], true, []);
			LayoutController.dragEnd();
			expect(stretch.$isActive).to.be.true;

			// Not cached if not dragging
			LayoutController.updateFlap([{ id: id2, x: 8, y: 10, width: 0, height: 0 }], false, []);
			LayoutController.updateFlap([{ id: id2, x: 8, y: 9, width: 0, height: 0 }], false, []);
			expect(stretch.$repo).to.not.equal(repo);
			expect(stretch.$repo.$configuration!.$index).to.equal(0);
		});

		describe("Two flap patterns", function() {

			it("Finds universal GPS patterns", function() {
				for(const [a, b] of TWO_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 6 },
						{ id: b, x: 11, y: 5, radius: 6 },
					]);
					const stretch = State.$stretches.get("1,2")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(1);
					const config = stretch.$repo.$configuration!;
					expect(config.$length).to.equal(2);
					const pattern = config.$pattern!;
					expect(pattern.$devices.length).to.equal(1);
					const device = pattern.$devices[0];
					expect(device.$gadgets.length).to.equal(1);
					const gadget = device.$gadgets[0];
					expect(gadget.pieces.length).to.equal(2, "Universal GPS has two pieces");
					expect(gadget.$slack).to.include(0.25);
				}
			});

			it("Find double relay patterns", function() {
				for(const [a, b] of TWO_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 8 },
						{ id: b, x: 10, y: 7, radius: 4 },
					]);
					const stretch = State.$stretches.get("1,2")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(4);
					const config = stretch.$repo.$configuration!;
					expect(config.$length).to.equal(1);
					const pattern = config.$pattern!;
					expect(pattern.$devices.length).to.equal(2);
				}

				for(const [a, b] of TWO_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 8 },
						{ id: b, x: 7, y: 10, radius: 4 },
					]);
					const stretch = State.$stretches.get("1,2")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(4);
					const config = stretch.$repo.$configuration!;
					expect(config.$length).to.equal(1);
					const pattern = config.$pattern!;
					expect(pattern.$devices.length).to.equal(2);
				}
			});

		});

		describe("Three flap patterns", function() {

			it("Does not depend on the ordering of flap ids nor the transformation factors", function() {
				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 9, y: 5, radius: 2 },
						{ id: b, x: 0, y: 0, radius: 8 },
						{ id: c, x: 6, y: 8, radius: 2 },
					]);
					const stretch = State.$stretches.get("1,2,3")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(1);
					expect(stretch.$repo.$configurations[0].$length).to.equal(1);

					const B = node(b)!;
					expect(B.$graphics.$patternContours.length).to.be.equal(1);

					const path = toPath(B.$graphics.$patternContours[0]);
					expect(path).to.equalPath("(8,3),(7,13/3),(7,6),(16/3,6),(4,7),(4,8)");
				}
				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: -9, y: 5, radius: 2 },
						{ id: b, x: 0, y: 0, radius: 8 },
						{ id: c, x: -6, y: 8, radius: 2 },
					]);
					const stretch = State.$stretches.get("1,2,3")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(1);
					expect(stretch.$repo.$configurations[0].$length).to.equal(1);

					const B = node(b)!;
					expect(B.$graphics.$patternContours.length).to.be.equal(1);

					const path = toPath(B.$graphics.$patternContours[0]);
					expect(path).to.equalPath("(-4,8),(-4,7),(-16/3,6),(-7,6),(-7,13/3),(-8,3)");
				}
			});

			it("Half integral relay", function() {
				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 11 },
						{ id: b, x: 8, y: 14, radius: 4 },
						{ id: c, x: 15, y: 8, radius: 6 },
					]);
					const stretch = State.$stretches.get("1,2,3")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(1);
					const config = stretch.$repo.$configurations[0];
					expect(config.$length).to.equal(2, "Two half integral patterns");
				}
			});

			it("Base join", function() {
				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 11 },
						{ id: b, x: 7, y: 14, radius: 4 },
						{ id: c, x: 15, y: 8, radius: 6 },
					]);
					const stretch = State.$stretches.get("1,2,3")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(1);
					const config = stretch.$repo.$configurations[0];
					expect(config.$length).to.equal(1);
					const pattern = config.$pattern!;
					expect(pattern.$devices.length).to.equal(1);
					const device = pattern.$devices[0];
					expect(device.$addOns.length).to.equal(0, "Base joins have no addOn");
				}
			});

			it("Standard join", function() {
				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 11 },
						{ id: b, x: 5, y: 12, radius: 2 },
						{ id: c, x: 15, y: 8, radius: 6 },
					]);
					const stretch = State.$stretches.get("1,2,3")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(1);
					const config = stretch.$repo.$configurations[0];
					expect(config.$length).to.equal(2, "Should find two standard joins.");
					const pattern = config.$pattern!;
					expect(pattern.$devices.length).to.equal(1, "Standard join creates 1 Device");
					const device = pattern.$devices[0];
					expect(device.$addOns.length).to.equal(1, "Standard join will have 1 addOn");
				}
			});

			it("Split join", function() {
				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 15 },
						{ id: b, x: 7, y: 20, radius: 6 },
						{ id: c, x: 16, y: 12, radius: 5 },
					]);
					const stretch = State.$stretches.get("1,2,3")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(1);
					const config = stretch.$repo.$configurations[0];
					expect(config.$length).to.equal(1);
					const pattern = config.$pattern!;
					expect(pattern.$devices.length).to.equal(2);
				}

				for(const [a, b, c] of THREE_PERMUTATION) {
					generateFromFlaps([
						{ id: a, x: 0, y: 0, radius: 15 },
						{ id: b, x: 20, y: 7, radius: 6 },
						{ id: c, x: 12, y: 16, radius: 5 },
					]);
					const stretch = State.$stretches.get("1,2,3")!;
					expect(stretch).to.be.not.undefined;
					expect(stretch.$repo.$configurations.length).to.equal(1);
					const config = stretch.$repo.$configurations[0];
					expect(config.$length).to.equal(1);
					const pattern = config.$pattern!;
					expect(pattern.$devices.length).to.equal(2);
				}
			});

		});

	});

	describe("Rendering", function() {

		it("Updates ridges when edges merge or split", function() {
			parseTree("(0,1,2),(0,2,2),(0,4,1),(4,3,7)", "(1,9,5,0,0),(2,6,8,0,0),(3,0,0,0,0)");
			complete();
			const result1 = State.$updateResult;
			const ridges1 = result1.graphics["s1,2,3.0"].ridges;
			expect(ridges1).to.containLine([{ x: 4.5, y: 3.5 }, { x: 6, y: 5 }]);

			State.$resetResult();
			TreeController.join(id4);
			const result2 = State.$updateResult;
			const data2 = result2.graphics["s1,2,3.0"];
			expect(data2).to.be.not.undefined;
			const ridges2 = data2.ridges;
			expect(ridges2).to.not.containLine([{ x: 4.5, y: 3.5 }, { x: 6, y: 5 }]);
			expect(ridges2).to.containLine([{ x: 4.5, y: 3.5 }, { x: 7, y: 6 }]);
		});

	});

});

const TWO_PERMUTATION = [
	[1, 2],
	[2, 1],
];

const THREE_PERMUTATION = [
	[1, 2, 3],
	[1, 3, 2],
	[2, 1, 3],
	[2, 3, 1],
	[3, 1, 2],
	[3, 2, 1],
];

function complete(): void {
	for(const stretch of State.$stretches.values()) stretch.$repo.$complete();
}

interface IFlap {
	id: number;
	x: number;
	y: number;
	radius: number;
}

function generateFromFlaps(flaps: IFlap[]): Tree {
	const tree = createTree(
		flaps.map(f => ({ n1: 0, n2: f.id, length: f.radius })),
		flaps.map(f => ({ id: f.id, width: 0, height: 0, x: f.x, y: f.y }))
	);
	complete();
	return tree;
}
