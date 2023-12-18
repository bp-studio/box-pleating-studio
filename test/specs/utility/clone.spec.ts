import { expect } from "chai";

import { clone, clonePolyfill, deepAssign } from "shared/utils/clone";

describe("Clone utility", function() {
	it("Works the same way as structureClone", function() {
		const obj = {
			data: {
				arr: [1, 2, 3],
			},
		};
		expect(clone).to.equal(structuredClone);
		expect(clonePolyfill(obj)).to.deep.equal(structuredClone(obj));
		expect(clonePolyfill(undefined)).to.be.undefined;
	});

	it("Deep assigns data", function() {
		const source = {
			data: {
				attr: "test",
			},
		};
		const target = {
			data: {
				attr: undefined as string | undefined,
			},
		};
		//@ts-ignore
		deepAssign(target, source, "test");
		expect(target.data.attr).to.equal("test");
	});
});
