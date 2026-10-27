import { describe, it, expect } from "@rstest/core";

import {
	ActivityClock, IDLE_CAP, MILESTONES, createStore, deviceSpec, diffHotkeys,
	getLevel, percentile, splitData
} from "app/utils/analyticsUtility";

import type { AnalyticsStore } from "app/utils/analyticsUtility";

const HOUR = 3600;

function store(patch: Partial<AnalyticsStore>): AnalyticsStore {
	return { ...createStore(false), ...patch };
}

describe("Analytics", () => {

	describe("User level", () => {

		it("Starts as new or legacy", () => {
			expect(createStore(false).level).to.equal("new");
			expect(createStore(true).level).to.equal("legacy");
			expect(getLevel(createStore(false), false)).to.equal("new");
			expect(getLevel(createStore(true), false)).to.equal("legacy");
		});

		it("Becomes regular after an hour or passing all milestones", () => {
			expect(getLevel(store({ activeSec: HOUR - 1 }), false)).to.equal("new");
			expect(getLevel(store({ activeSec: HOUR }), false)).to.equal("regular");
			const passed = store({ milestones: [...MILESTONES] });
			expect(getLevel(passed, false)).to.equal("regular");
		});

		it("Becomes advanced after ten hours or working on a big design", () => {
			expect(getLevel(store({ activeSec: 10 * HOUR }), false)).to.equal("advanced");
			expect(getLevel(store({}), true)).to.equal("advanced");
			expect(getLevel(store({ level: "legacy" }), true)).to.equal("advanced");
		});

		it("Never goes down", () => {
			expect(getLevel(store({ level: "regular" }), false)).to.equal("regular");
			expect(getLevel(store({ level: "advanced" }), false)).to.equal("advanced");
			expect(getLevel(store({ level: "legacy", activeSec: 2 * HOUR }), false))
				.to.equal("legacy");
		});
	});

	it("Measures active time with idle gaps capped", () => {
		const clock = new ActivityClock();
		expect(clock.$idle(100)).to.equal(0);
		expect(clock.$tick(100)).to.equal(0);
		expect(clock.$tick(1100)).to.equal(1000);
		expect(clock.$idle(5100)).to.equal(4000);
		expect(clock.$tick(1100 + 10 * IDLE_CAP)).to.equal(IDLE_CAP);

		// The time after resetting is not counted
		clock.$reset();
		expect(clock.$idle(0)).to.equal(0);
		expect(clock.$tick(2 * IDLE_CAP)).to.equal(0);
	});

	it("Computes percentiles by nearest rank", () => {
		expect(percentile([], 50)).to.equal(0);
		expect(percentile([5], 95)).to.equal(5);
		const values = [9, 1, 8, 2, 7, 3, 6, 4, 5, 10];
		expect(percentile(values, 50)).to.equal(5);
		expect(percentile(values, 95)).to.equal(10);
		expect(percentile(values, 0)).to.equal(1);
		expect(values[0]).to.equal(9); // Not mutated
	});

	it("Splits data into parameters", () => {
		expect(splitData("abcdefg", 3, 2)).to.deep.equal({ data1: "abc", data2: "def" });
		expect(splitData("ab", 3, 3)).to.deep.equal({ data1: "ab" });
	});

	it("Lists customized hotkeys", () => {
		const defaults = { m: { u: "W", d: "S" }, n: { d: "\t", cn: "T" } };
		expect(diffHotkeys(structuredClone(defaults), defaults)).to.equal("");
		const current = { m: { u: "I", d: "S" }, n: { d: "=", cn: "" } };
		expect(diffHotkeys(current, defaults)).to.equal("m.u=I n.d== n.cn=");
		expect(diffHotkeys({ m: { u: "W", d: "S" } }, defaults)).to.equal("");
		expect(diffHotkeys(defaults, { n: { d: "X" } })).to.equal("n.d=Tab");
	});

	it("Describes the device", () => {
		expect(deviceSpec(8, 4)).to.equal("8c4g");
		expect(deviceSpec(4, undefined)).to.equal("4c?g");
		expect(deviceSpec(undefined, undefined)).to.equal("?c?g");
	});
});
