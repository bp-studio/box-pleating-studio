import { describe, it, expect } from "@rstest/core";

import { parseTree } from "@utils/tree";
import { parsePath } from "@utils/path";
import { LayoutController } from "core/controller/layoutController";
import { CreaseType } from "shared/types/cp";
import { applyHingeExport } from "client/plugins/cp/hinge";

import type { CPLine, HingeExport } from "shared/types/cp";

function getCP(hinge: HingeExport = "auxiliary"): CPLine[] {
	parseTree("(0,1,7),(0,2,4)", "(1,0,0,0,0),(2,8,9,0,0)");
	const sheet = parsePath("(0,0),(16,0),(16,16),(0,16)");
	return applyHingeExport(LayoutController.getCP(sheet), hinge);
}

/**
 * The creases lying on the given segment, which are subdivided at the
 * intersections with the other creases.
 */
function creasesOn(lines: readonly CPLine[], a: IPoint, b: IPoint): CPLine[] {
	const on = (p: IPoint): boolean => {
		const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
		const dot = (p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y);
		const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
		return cross == 0 && dot >= 0 && dot <= l2;
	};
	return lines.filter(l => on(l.p1) && on(l.p2));
}

function typesOn(lines: readonly CPLine[], a: IPoint, b: IPoint): CreaseType[] {
	return creasesOn(lines, a, b).map(l => l.type);
}

const HINGE = [{ x: 0, y: 7 }, { x: 4, y: 7 }] as const;

describe("CP exporting", () => {

	it("Exports hinges as auxiliary lines by default", () => {
		const types = typesOn(getCP(), ...HINGE);
		expect(types).to.have.length(4); // Subdivided by the pleats
		expect(types.every(t => t == CreaseType.Auxiliary)).to.be.true;
	});

	it("Exports hinges as valley lines if specified", () => {
		const types = typesOn(getCP("valley"), ...HINGE);
		expect(types).to.have.length(4);
		expect(types.every(t => t == CreaseType.Valley)).to.be.true;
	});

	it("Omits hinges if specified", () => {
		expect(typesOn(getCP("none"), ...HINGE)).to.be.empty;
	});

	it("Omits the other auxiliary lines along with the hinges", () => {
		// The sides of the tip rectangle of flap 2 cannot be determined.
		parseTree("(0,1,6),(0,2,4)", "(1,0,0,0,0),(2,12,12,2,2)");
		const sheet = parsePath("(0,0),(16,0),(16,16),(0,16)");
		const lines = LayoutController.getCP(sheet);
		const isAux = (l: CPLine): boolean => l.type == CreaseType.Auxiliary;
		expect(lines.some(l => isAux(l) && !l.hinge)).to.be.true;
		expect(applyHingeExport(lines, "valley").some(isAux)).to.be.true;
		expect(applyHingeExport(lines, "none").some(isAux)).to.be.false;
	});

	it("Assigns the ridges and the axis-parallel creases", () => {
		const lines = getCP();
		// Both flaps are at elevation zero, so the ridges from the tips are
		// mountains.
		expect(typesOn(lines, { x: 0, y: 0 }, { x: 1, y: 1 }))
			.to.deep.equal([CreaseType.Mountain]);
		const assigned = [CreaseType.Mountain, CreaseType.Valley];
		// A ridge of the device
		expect(assigned).to.include.members(
			typesOn(lines, { x: 4, y: 7 }, { x: 7, y: 8 })
		);
		// An axis-parallel crease in the device
		expect(assigned).to.include.members(
			typesOn(lines, { x: 1, y: 1 }, { x: 5, y: 4 })
		);
	});

	it("Ignores pattern-less repo", () => {
		parseTree("(2,0,10),(2,1,2),(2,3,2)", "(0,0,0,0,0),(1,11,5,0,0),(3,7,10,0,0)");
		const result = LayoutController.getCP(parsePath("(0,0),(16,0),(16,16),(0,16)"));
		// v0.8: flap 0 is invaded by flap 1 (see ValidJunction.$invasion),
		// so its hinge is carved at the corner, and since the carved quadrant
		// has no pattern, its default ridge is omitted as well. Also, the
		// creases are subdivided at the intersections in the generic CP.
		expect(result.length).to.equal(81);
	});
});
