import * as C from "shared/types/constants";

describe("Constants", function() {

	it("Minimal rectangular sheet size", function() {
		expect(C.MIN_RECT_SIZE).to.lessThan(C.MAX_SHEET_SIZE);
	});

	it("Minimal diagonal sheet size", function() {
		expect(C.MIN_DIAG_SIZE).to.lessThan(C.MAX_SHEET_SIZE);
	});

});
