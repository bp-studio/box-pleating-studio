import { expect } from "chai";

import { StartEvent } from "core/math/polyBool/event";
import { getCurvature } from "core/math/polyBool/intersection/rrEventProvider";
import { EPSILON, ArcSegment } from "core/math/polyBool/segment/arcSegment";

function dist(p1: IPoint, p2: IPoint): number {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;
	return Math.sqrt(dx * dx + dy * dy);
}

describe("Arc", function() {
	it("Computes intersection", function() {
		const c1 = { x: 6, y: 6 };
		const c2 = { x: 3, y: 3 };
		const arc1 = new ArcSegment(c1, 6, { x: 0, y: 6 }, { x: 6, y: 0 }, 0);
		const arc2 = new ArcSegment(c2, 2, { x: 1, y: 3 }, { x: 3, y: 1 }, 0);
		const result = [...arc1.$intersection(arc2)];
		expect(result.length).to.equal(2);
		for(const p of result) {
			expect(dist(p, c1)).to.be.closeTo(6, EPSILON);
			expect(dist(p, c2)).to.be.closeTo(2, EPSILON);
		}
	});

	it("Computes anchor", function() {
		const arc1 = new ArcSegment({ x: 6, y: 6 }, 6, { x: 0, y: 6 }, { x: 6, y: 0 }, 0);
		const arc2 = new ArcSegment({ x: 0, y: 0 }, 2, { x: Math.SQRT2, y: Math.SQRT2 }, { x: 0, y: 2 }, 0);
		expect(arc1.$anchor).to.eql(arc2.$center);
		expect(arc2.$anchor.x).to.be.closeTo(Math.sqrt(8) - 2, EPSILON);
		expect(arc2.$anchor.y).to.be.closeTo(2, EPSILON);
	});

	it("Has signed curvature", function() {
		const s = { x: 0, y: 6 };
		const arc = new ArcSegment({ x: 6, y: 6 }, 6, s, { x: 6, y: 0 }, 0);
		const ev = new StartEvent(s, arc, 1, 0);
		expect(getCurvature(ev)).to.equal(1 / 6);
	});
});
