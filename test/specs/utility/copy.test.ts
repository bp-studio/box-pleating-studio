import { it, expect } from "@rstest/core";

import { deepCopy } from "shared/utils/copy";

export default function() {

	it("Copy nested objects", () => {
		const target = { test: { prop: "test" } };
		deepCopy(target, { test: { prop: "ok" } });
		expect(target).to.eql({ test: { prop: "ok" } });
	});

	it("Ignores properties that are absent in source", () => {
		const target = { test: "test", newProp: "new", objProp: {} };
		deepCopy(target, { test: "ok" });
		expect(target).to.eql({ test: "ok", newProp: "new", objProp: {} });
	});

	it("Ignores properties that are absent in target", () => {
		const target = { test: "test" };
		deepCopy(target, { test: "ok", oldProp: "old" });
		expect(target).to.eql({ test: "ok" });
	});
}
