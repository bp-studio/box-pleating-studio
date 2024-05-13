import { Matrix } from "core/math/geometry/matrix";
import { Vector } from "core/math/geometry/vector";

export default function() {

	it("Computes transformation matrix", function() {
		const from = new Vector({ x: -4, y: -2 });
		const to = new Vector({ x: -2, y: 0 });
		const result = Matrix.$getTransformMatrix(from, to).toString();
		expect(result).to.equal("2/5,1/5,-1/5,2/5");
	});

}
