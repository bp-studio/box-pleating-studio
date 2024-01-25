import { State } from "core/service/state";
import { generateFromFlaps } from "./util";

export default function() {
	it("Finds universal GPS patterns", function() {
		for(const [a, b] of TWO_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 6 },
				{ id: b, x: 11, y: 5, radius: 6 },
			]);
			const stretch = State.$stretches.get("1,2")!;
			expect(stretch).to.be.not.undefined;
			expect(stretch.$repo.$configurations.length).to.equal(1);
			const config = stretch.$repo.$configuration!;
			expect(config.$length).to.equal(2);
			const pattern = config.$pattern!;
			expect(pattern.$devices.length).to.equal(1);
			const device = pattern.$devices[0];
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
			const stretch = State.$stretches.get("1,2")!;
			expect(stretch).to.be.not.undefined;
			expect(stretch.$repo.$configurations.length).to.equal(4);
			const config = stretch.$repo.$configuration!;
			expect(config.$length).to.equal(1);
			const pattern = config.$pattern!;
			expect(pattern.$devices.length).to.equal(2);
		}

		for(const [a, b] of TWO_PERMUTATION) {
			generateFromFlaps([
				{ id: a, x: 0, y: 0, radius: 8 },
				{ id: b, x: 7, y: 10, radius: 4 },
			]);
			const stretch = State.$stretches.get("1,2")!;
			expect(stretch).to.be.not.undefined;
			expect(stretch.$repo.$configurations.length).to.equal(4);
			const config = stretch.$repo.$configuration!;
			expect(config.$length).to.equal(1);
			const pattern = config.$pattern!;
			expect(pattern.$devices.length).to.equal(2);
		}
	});
}

const TWO_PERMUTATION = [
	[1, 2],
	[2, 1],
];
