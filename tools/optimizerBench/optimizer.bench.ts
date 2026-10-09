/**
 * Benchmark for the integer stages (fitting and tidying) of the Optimizer.
 * See README.md for the usage.
 */

import { describe, it, beforeAll } from "@rstest/core";
import { readFileSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

import { createTree } from "@utils/tree";
import { Migration } from "client/patches";
import { Bridge } from "client/plugins/optimizer/bridge";
import { TreeController } from "core/controller/treeController";
import { GridType } from "shared/json";
import factory from "lib/optimizer/debug/optimizer.js";

import type {
	OptimizerRequest, OptimizerResult
} from "client/plugins/optimizer/types";
import type { JFlap, JProject, NodeId } from "shared/json";

interface RunResult {
	fitMs: number;
	tidyMs: number;
	continuous: number;
	width: number;
	verticesBefore: number;
	verticesAfter: number;
	log: string[];
}

interface Case {
	name: string;
	request: OptimizerRequest;
}

const dir = process.env.BPS_DIR ??
	join(homedir(), "Documents/Origami/BP Studio Projects");
const only = process.env.BPS_ONLY;
const useBH = process.env.BH == "1";
const useDimension = process.env.DIM == "1";
const SEED = 12345;

/** Designs with fewer flaps are trivial for the optimizer. */
const MIN_FLAPS = 3;

/** The step of the jittering of the flaps at the same position. */
const JITTER = 0.1;

describe("Optimizer integer stages benchmark", () => {

	const cases: Case[] = [];

	beforeAll(() => {
		const files = readdirSync(dir)
			.filter(f => f.endsWith(".bps") && (!only || f.includes(only)));
		for(const file of files) {
			try {
				const json = Migration.$process(
					JSON.parse(readFileSync(join(dir, file), "utf8"))
				);
				const request = createRequest(json);
				if(request) {
					cases.push({ name: file.replace(/\.bps$/, ""), request });
				}
			} catch(e) {
				const message = e instanceof Error ? e.message : e;
				console.log(`Skipping ${file}: ${message}`);
			}
		}
		console.log(`Loaded ${cases.length} designs from ${dir}`);
	});

	it("Runs the optimizer", async () => {
		const rows: string[] = [];
		rows.push(
			"| design | flaps | cont. | size | fit ms | vertices before | vertices after | tidy ms |",
			"|---|---|---|---|---|---|---|---|"
		);
		for(const c of cases) {
			const flaps = c.request.problem.flaps.length;
			process.stdout.write(`${c.name} (${flaps} flaps)...`);
			// Sequential by design, for timing
			// eslint-disable-next-line no-await-in-loop
			const r = await run(c.request);
			const { width, verticesBefore, verticesAfter } = r;
			process.stdout.write(
				` size ${width}, vertices ${verticesBefore} -> ${verticesAfter}\n`
			);
			for(const line of r.log) console.log("  " + line);
			rows.push(`| ${c.name} | ${flaps} | ${r.continuous.toFixed(2)} | ${width} | ${r.fitMs.toFixed(0)} | ${verticesBefore} | ${verticesAfter} | ${r.tidyMs.toFixed(0)} |`);
		}
		console.log("\n" + rows.join("\n"));
	});
});

async function run(request: OptimizerRequest): Promise<RunResult> {
	const log: string[] = [];
	let fitStart = 0;
	let tidyStart = 0;
	let tidyEnd = 0;
	let continuous = 0;
	let verticesBefore = 0;
	let verticesAfter = 0;
	const instance = await factory({
		print: (msg: string) => {
			if(msg.startsWith("Continuous sheet size:")) {
				continuous = Number(msg.split(":")[1]);
				fitStart = performance.now();
			} else if(msg.startsWith("CSP:") || msg.startsWith("Tidy:")) {
				log.push(msg);
				if(msg.startsWith("Tidy:")) tidyEnd = performance.now();
			} else if(msg.startsWith("{\"event\": \"tidy\"")) {
				const data = JSON.parse(msg).data as [number, number];
				if(!tidyStart) {
					tidyStart = performance.now();
					verticesBefore = data[0];
				}
				verticesAfter = data[1];
				tidyEnd = performance.now();
			}
		},
		printErr: (msg: string) => console.error(msg),
		checkInterrupt: () => false,
	});
	const bridge = new Bridge(instance);
	const result: OptimizerResult = await bridge.solve(request, SEED);
	return {
		fitMs: tidyStart - fitStart,
		tidyMs: tidyEnd - tidyStart,
		continuous,
		width: result.width,
		verticesBefore,
		verticesAfter,
		log,
	};
}

function createRequest(json: JProject): OptimizerRequest | null {
	const { flaps, sheet } = json.design.layout;
	const { edges } = json.design.tree;
	if(flaps.length < MIN_FLAPS) return null;

	// Older files have no sheet type (the app defaults to rectangular)
	sheet.type ??= GridType.rectangular;
	if(process.env.TYPE == "diag") sheet.type = GridType.diagonal;

	// Same as createOptimizerRequest in the client
	if(!useDimension) flaps.forEach(f => f.width = f.height = 0);

	createTree(edges, flaps);
	const hierarchies = TreeController.getHierarchy(false, useDimension);

	const flapMap = new Map<NodeId, JFlap>();
	for(const f of flaps) flapMap.set(f.id, f);
	const orderedFlaps = hierarchies[hierarchies.length - 1].leaves
		.map(id => flapMap.get(id)!);
	if(orderedFlaps.some(f => !f)) return null;

	// Same as makeInitialVector in the client, but with deterministic jittering
	const set = new Set<string>();
	let jitter = 0;
	const vec = orderedFlaps.map(f => {
		let { x, y } = f;
		let key = x + "," + y;
		while(set.has(key)) {
			jitter += JITTER;
			x = f.x + jitter;
			y = f.y + jitter;
			key = x + "," + y;
		}
		set.add(key);
		return { x: x / sheet.width, y: y / sheet.height };
	});

	return {
		command: "start",
		useBH,
		layout: "view",
		random: 0,
		problem: {
			type: sheet.type,
			flaps: orderedFlaps.map(f => ({
				id: f.id, width: f.width, height: f.height,
			})),
			hierarchies,
			tree: TreeController.getStructure(),
		},
		vec,
	};
}
