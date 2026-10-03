import { describe, it, expect, beforeAll } from "@rstest/core";

import { getJSON } from "@utils/sample";
import { Migration } from "client/patches";
import { options } from "client/options";
import { MAX_SHEET_SIZE } from "shared/types/constants";
import { generateFromFlaps, complete } from "./pattern/util";
import { State, fullReset } from "core/service/state";
import { DesignController } from "core/controller/designController";
import { clone } from "shared/utils/clone";
import { JoinStrategy } from "shared/json";

import type { JEdge, JFlap, JPartition, JProject, JStretch } from "shared/json";

describe("Migration", () => {

	describe("Versioning", () => {
		it("Treats unversioned file as version 0", () => {
			expect(Migration.$getVersionIndex({})).to.equal(0);
		});

		it("Throws error on unknown version", () => {
			expect(() => Migration.$getVersionIndex({ version: "~~~" })).to.throw();
		});
	});

	describe("v0.6", () => {

		let result: JProject;

		beforeAll(async () => {
			const sample = await getJSON("v04.session.sample.json");
			result = Migration.$process(sample);
		});

		it("Isolates design", () => {
			expect(result).to.have.property("design");
			expect(result.design).to.have.all.keys("title", "description", "mode", "layout", "tree");
			expect(result).to.not.have.any.keys("title", "description", "mode", "layout", "tree");
		});

		it("Moves history to the top-level", () => {
			expect(result).to.have.property("history");
			expect(result.design).to.not.have.property("history");
		});

		it("Moves state to the top-level", () => {
			expect(result).to.have.property("state");
			expect(result.state).to.have.all.keys("layout");
			expect(result.state?.layout).to.have.all.keys("zoom", "scroll");
			expect(result.design.layout).to.not.have.any.keys("zoom", "scroll");
		});
	});

	describe("v0.8", () => {

		const CASES = {
			"base join": [[0, 0, 11], [7, 14, 4], [15, 8, 6]],
			"half-integral relay": [[0, 0, 10], [7, 11, 2], [10, 6, 1]],
			"simple join": [[9, 5, 2], [0, 0, 8], [6, 8, 2]],
		};

		it("Moves strategies to overlaps", () => {
			for(const [name, flaps] of Object.entries(CASES)) {
				const stretch = searchStretch(flaps);
				const legacy = toLegacy(stretch);
				const project = makeProject(flaps, legacy);
				project.design.layout.stretches.push({ id: "8,9" });
				project.version = "0.7";
				const step = {
					commands: [], mode: "layout" as const, before: [], after: [],
				};
				const flap = project.design.layout.flaps[0];
				project.history = {
					index: 2,
					savedIndex: 2,
					steps: [
						{ ...step, construct: [["f1", flap], ["s", legacy]] },
						{ ...step, destruct: [["s", clone(legacy)]] },
					],
				};

				const result = Migration.$process(toFile(project));
				const expected: unknown = JSON.parse(JSON.stringify(stretch));
				const [step1, step2] = result.history!.steps;
				for(const s of [
					result.design.layout.stretches[0],
					step1.construct![1][1],
					step2.destruct![0][1],
				]) {
					expect(s).to.deep.equal(expected, name);
				}
				expect(step1.construct![0][1]).to.deep.equal(flap);
				expect(result.design.layout.stretches[1])
					.to.deep.equal({ id: "8,9" });
			}
		});

		it("Recognizes the migrated pattern when searching", () => {
			const flaps = CASES["base join"];
			const stretch = searchStretch(flaps);
			const count = State.$stretches.get(stretch.id)!.$repo
				.$configuration!.$length;
			const { id, configuration, pattern } = toLegacy(stretch);
			const project = makeProject(flaps, { id, configuration, pattern });
			project.version = "0.7";

			fullReset();
			DesignController.init(Migration.$process(toFile(project)).design);
			complete();
			const repo = State.$stretches.get(id)!.$repo;
			expect(repo.$configurations.length).to.equal(1);
			expect(repo.$configuration!.$length).to.equal(count);
		});

	});

	describe("Checks", () => {

		it("Imposes sheet limit", async () => {
			let deprecated = false;
			options.onDeprecate = () => deprecated = true;
			const sample = await getJSON("v07.troll.sample.json");
			const result = Migration.$process(sample);
			expect(result.design.layout.sheet.width).to.equal(MAX_SHEET_SIZE);
			expect(deprecated).to.be.true;
			delete options.onDeprecate;
		});

	});

});

/**
 * Search the patterns of the given flaps, and return the only stretch,
 * keeping only the configurations that can be represented in the format
 * before v0.8 (that is, without joining gadgets of non-default strategies).
 */
function searchStretch(flaps: number[][]): JStretch {
	generateFromFlaps(
		flaps.map(([x, y, radius], i) => ({ id: i + 1, x, y, radius }))
	);
	complete();
	const [stretch] = State.$stretches.values();
	const result = stretch.toJSON();
	const repo = result.repo!;
	repo.configurations = repo.configurations.filter(c => c.partitions.every(
		p => p.overlaps.length == 1 || p.overlaps.every(o => !o.gadget)
	));
	return result;
}

function makeProject(flaps: number[][], stretch: JStretch): JProject {
	const project = Migration.$getSample();
	const { tree, layout } = project.design;
	tree.edges = flaps.map(
		([, , length], i) => ({ n1: 0, n2: i + 1, length }) as JEdge
	);
	layout.flaps = flaps.map(
		([x, y], i) => ({ id: i + 1, x, y, width: 0, height: 0 }) as JFlap
	);
	layout.stretches = [stretch];
	return project;
}

/** Convert a {@link JStretch} to the format before v0.8. */
function toLegacy(stretch: JStretch): JStretch {
	const result = clone(stretch);
	const repo = result.repo?.configurations ?? [];
	const configs = [result.configuration, ...repo];
	for(const config of configs) {
		for(const partition of config!.partitions) {
			const p = partition as JPartition & { strategy?: string };
			const strategy =
				p.overlaps.map(o => o.gadget ?? o.join).find(s => s);
			for(const o of p.overlaps) {
				delete o.gadget;
				delete o.join;
			}
			if(strategy != JoinStrategy.simple) p.strategy = strategy;
		}
	}
	return result;
}

/** Simulate saving and loading the file. */
function toFile(project: JProject): Pseudo<JProject> {
	return JSON.parse(JSON.stringify(project)) as Pseudo<JProject>;
}
