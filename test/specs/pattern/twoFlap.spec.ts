import { expectRepo, generateFromFlaps } from "./util";

export default function() {

	it("Finds universal GPS patterns", function() {
		for(const [a, b] of TWO_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 6 },
				{ id: b, x: 11, y: 5, radius: 6 },
			]);
			const device = expectRepo("1,2", 1, 2, 1)[0];
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
			expectRepo("1,2", 4, 1, 2);
		}

		for(const [a, b] of TWO_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 8 },
				{ id: b, x: 7, y: 10, radius: 4 },
			]);
			expectRepo("1,2", 4, 1, 2);
		}
	});
}

const TWO_PERMUTATION = [
	[1, 2],
	[2, 1],
];
