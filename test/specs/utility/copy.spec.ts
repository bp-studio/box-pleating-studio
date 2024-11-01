import { deepCopy } from "shared/utils/copy";

export default function() {

	it("Copy nested objects", function() {
		const target = { test: { prop: "test" } };
		deepCopy(target, { test: { prop: "ok" } });
		expect(target).to.eql({ test: { prop: "ok" } });
	});

	it("Ignores properties that are absent in source", function() {
		const target = { test: "test", newProp: "new" };
		deepCopy(target, { test: "ok" });
		expect(target).to.eql({ test: "ok", newProp: "new" });
	});

	it("Ignores properties that are absent in target", function() {
		const target = { test: "test" };
		deepCopy(target, { test: "ok", oldProp: "old" });
		expect(target).to.eql({ test: "ok" });
	});
}
