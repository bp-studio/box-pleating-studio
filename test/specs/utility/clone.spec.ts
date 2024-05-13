import { clone, clonePolyfill, deepAssign } from "shared/utils/clone";

export default function() {
	it("Use native structureClone when possible", function() {
		expect(clone).to.equal(structuredClone);
	});

	it("Works the same way as structureClone", function() {
		const obj = {
			data: {
				arr: [1, 2, 3],
			},
		};
		expect(clonePolyfill(obj)).to.deep.equal(structuredClone(obj));
		expect(clonePolyfill(undefined)).to.be.undefined;
	});

	it("Handles recursive reference", function() {
		const obj = {
			self: undefined as unknown,
		};
		obj.self = obj; // recursive reference

		const cloned = clonePolyfill(obj);
		expect(cloned.self).to.not.equal(obj.self);
		expect(cloned.self).to.equal(cloned);
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
}
