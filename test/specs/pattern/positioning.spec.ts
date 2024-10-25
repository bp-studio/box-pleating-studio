import { parseTree } from "@utils/tree";
import { expectRepo } from "./util";

export default function() {
	describe("Three flap relay", function() {

		it("Pushes gadgets towards the shared corner as much as possible", function() {
			parseTree("(0,1,1),(0,2,18),(0,3,1)", "(1,7,18,0,0),(2,0,0,0,0),(3,9,17,0,0)");
			const devices = expectRepo("1,2,3", 1, 1, 2);
			const device = devices.find(d => d.$gadgets[0].widthSpan == 3)!;
			expect(device).to.be.not.undefined;
			expect(device.$offset).to.equal(0);
		});

	});
}
