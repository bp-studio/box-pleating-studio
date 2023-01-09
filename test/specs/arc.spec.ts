import { expect } from "chai";

import { ArcSegment } from "core/math/polyBool/segment/arcSegment";

function dist(p1: IPoint, p2: IPoint): number {
	const dx = p1.x - p2.x;
	const dy = p1.y - p2.y;
	return Math.sqrt(dx * dx + dy * dy);
}

const EPSILON = 1e-14;

describe("Arc", function() {
	it("Computes intersection", function() {
		const c1 = { x: 6, y: 6 };
		const c2 = { x: 3, y: 3 };
		const arc1 = new ArcSegment(c1, 6, { x: 0, y: 6 }, { x: 6, y: 0 }, 0);
		const arc2 = new ArcSegment(c2, 2, { x: 1, y: 3 }, { x: 3, y: 1 }, 0);
		const result = arc1.$intersection(arc2);
		expect(result.length).to.equal(2);
		for(const p of result) {
			expect(dist(p, c1)).to.be.closeTo(6, EPSILON);
			expect(dist(p, c2)).to.be.closeTo(2, EPSILON);
		}
	});
});
