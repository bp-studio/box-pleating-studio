import { describe, it, expect } from "@rstest/core";

import * as C from "shared/types/constants";

describe("Constants", () => {

	it("Minimal rectangular sheet size", () => {
		expect(C.MIN_RECT_SIZE).to.lessThan(C.MAX_SHEET_SIZE);
	});

	it("Minimal diagonal sheet size", () => {
		expect(C.MIN_DIAG_SIZE).to.lessThan(C.MAX_SHEET_SIZE);
	});

});
