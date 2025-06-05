import { Matrix } from "core/math/geometry/matrix";
import { Vector } from "core/math/geometry/vector";
import { applyTransform } from "shared/types/geometry";

export default function() {

	it("Computes transformation matrix", function() {
		const p1: IPoint = { x: -4, y: -2 };
		const p2: IPoint = { x: -2, y: 0 };
		const from = new Vector(p1);
		const to = new Vector(p2);
		const matrix = Matrix.$getTransformMatrix(from, to);
		const result = matrix.toString();
		expect(result).to.equal("2/5,1/5,-1/5,2/5");

		const transformed = applyTransform(p1, [...matrix.toArray(), 0, 0]);
		expect(transformed).to.eql(p2);
	});

}
