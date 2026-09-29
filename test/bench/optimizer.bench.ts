/**
 * Benchmark for the integer stages (fitting and tidying) of the Optimizer.
 *
 * Usage:
 *   make                                       # builds lib/optimizer/debug
 *   pnpm mocha --spec test/bench/optimizer.bench.ts
 *
 * Note that the debug build is about 25x slower than the optimized ones.
 * For timing, build an optimized Node.js build with
 *   make MODE=opt "CXXFLAG_opt=-O3 -fno-exceptions -flto -D_OPENMP" "DEP_opt=lib/include/libnlopt.slsqp.2.11.0.a" "LDFLAG_opt=-lnlopt.slsqp.2.11.0 -sENVIRONMENT=node"
 * and change the import below to lib/optimizer/opt/optimizer.js.
 *
 * Environment variables:
 *   BPS_DIR   Directory containing the .bps files to use (default: ~/Documents/Origami/BP Studio Projects)
 *   BPS_ONLY  Substring filter for file names
 *   BH        Set to 1 to enable basin-hopping
 *   DIM       Set to 1 to keep flap dimensions (default: off, since saved designs are typically already fitted)
 *   TYPE      Set to "diag" to force diagonal sheets
 */

import { readFileSync, readdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";

import { createTree } from "@utils/tree";
import { Migration } from "client/patches";
import { Bridge } from "client/plugins/optimizer/bridge";
import { TreeController } from "core/controller/treeController";
import { GridType } from "shared/json";
import factory from "lib/optimizer/debug/optimizer.js";

import type { OptimizerRequest, OptimizerResult } from "client/plugins/optimizer/types";
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

const dir = process.env.BPS_DIR ?? join(homedir(), "Documents/Origami/BP Studio Projects");
const only = process.env.BPS_ONLY;
const useBH = process.env.BH == "1";
const useDimension = process.env.DIM == "1";
const SEED = 12345;

describe("Optimizer integer stages benchmark", function() {

	const cases: Case[] = [];

	before(function() {
		const files = readdirSync(dir).filter(f => f.endsWith(".bps") && (!only || f.includes(only)));
		for(const file of files) {
			try {
				const json = Migration.$process(JSON.parse(readFileSync(join(dir, file), "utf8")));
				const request = createRequest(json);
				if(request) cases.push({ name: file.replace(/\.bps$/, ""), request });
			} catch(e) {
				console.log(`Skipping ${file}: ${e instanceof Error ? e.message : e}`);
			}
		}
		console.log(`Loaded ${cases.length} designs from ${dir}`);
	});

	it("Runs the optimizer", async function() {
		const rows: string[] = [];
		rows.push("| design | flaps | cont. | size | fit ms | vertices before | vertices after | tidy ms |", "|---|---|---|---|---|---|---|---|");
		for(const c of cases) {
			const flaps = c.request.problem.flaps.length;
			process.stdout.write(`${c.name} (${flaps} flaps)...`);
			const r = await run(c.request); // eslint-disable-line no-await-in-loop -- Sequential by design, for timing
			process.stdout.write(` size ${r.width}, vertices ${r.verticesBefore} -> ${r.verticesAfter}\n`);
			for(const line of r.log) console.log("  " + line);
			rows.push(`| ${c.name} | ${flaps} | ${r.continuous.toFixed(2)} | ${r.width} | ${r.fitMs.toFixed(0)} | ${r.verticesBefore} | ${r.verticesAfter} | ${r.tidyMs.toFixed(0)} |`);
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
	if(flaps.length < 3) return null;
	sheet.type ??= GridType.rectangular; // Older files have no sheet type (the app defaults to rectangular)
	if(process.env.TYPE == "diag") sheet.type = GridType.diagonal;
	if(!useDimension) flaps.forEach(f => f.width = f.height = 0); // Same as createOptimizerRequest in the client
	createTree(edges, flaps);
	const hierarchies = TreeController.getHierarchy(false, useDimension);

	const flapMap = new Map<NodeId, JFlap>();
	for(const f of flaps) flapMap.set(f.id, f);
	const orderedFlaps = hierarchies[hierarchies.length - 1].leaves.map(id => flapMap.get(id)!);
	if(orderedFlaps.some(f => !f)) return null;

	// Same as makeInitialVector in the client, but with deterministic jittering
	const set = new Set<string>();
	let jitter = 0;
	const vec = orderedFlaps.map(f => {
		let { x, y } = f;
		let key = x + "," + y;
		while(set.has(key)) {
			jitter += 0.1;
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
			flaps: orderedFlaps.map(f => ({ id: f.id, width: f.width, height: f.height })),
			hierarchies,
			tree: TreeController.getStructure(),
		},
		vec,
	};
}
