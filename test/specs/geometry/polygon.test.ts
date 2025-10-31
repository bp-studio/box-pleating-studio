import { describe, it, expect } from "@rstest/core";

import { parsePath } from "@utils/path";
import { isInside } from "core/math/geometry/winding";

export default function() {

	describe("Check point inside simple polygon", () => {

		it("Returns false on boundary", () => {
			const result = isInside({ x: 11, y: 8 }, parsePath("(0,0),(1,3),(15,10),(14,7)"));
			expect(result).to.be.false;
		});

	});

}
