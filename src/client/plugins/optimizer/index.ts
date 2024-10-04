import { MAX_SHEET_SIZE } from "shared/types/constants";

import type { OptimizerEvent, OptimizerRequest, OptimizerResult, LayoutMode, OptimizerOptionsBase, OptimizerCommand } from "./types";
import type { JProject } from "shared/json";
import type { DistMap } from "core/design/context/treeUtils";
import type { NodeId } from "shared/json/tree";
import type { Project } from "client/project/project";

let workerReady: PromiseWithResolvers<Worker>;

export function initOptimizerWorker(): void {
	workerReady = Promise.withResolvers<Worker>();
	const worker = new Worker(new URL("./worker.ts", import.meta.url), { name: "optimizer" });
	const COMPLETE = 100;
	worker.onmessage = ev => {
		if(!ev.data) return;
		if(ev.data.loading == COMPLETE) workerReady.resolve(worker);
		if("result" in ev.data) execution.resolve(ev.data.result);
		if("error" in ev.data) execution.reject(ev.data.error);
		if("event" in ev.data) callback?.(ev.data);
	};
}

initOptimizerWorker();

let callback: Consumer<OptimizerEvent>;
let execution: PromiseWithResolvers<OptimizerResult>;

export interface OptimizerOptions extends OptimizerOptionsBase {
	random: number;

	/** Callback for showing the progress of optimizer. */
	callback: Consumer<OptimizerEvent>;
}

function handler(command: OptimizerCommand, worker: Worker): void {
	if(command == "skip") {
		worker.postMessage({ command });
	} else {
		execution.reject();
		worker.terminate();
		initOptimizerWorker();
	}
}

export async function optimizer(project: Project, options: OptimizerOptions): Promise<JProject> {
	callback = options.callback;
	const worker = await workerReady.promise;
	callback({
		event: "handle",
		data: command => handler(command, worker),
	});
	execution = Promise.withResolvers();

	const json = project.toJSON();
	const distMap = await project.$core.tree.getDistMap();
	const map = createNonSkippingDistMap(distMap, json);
	const request = createOptimizerRequest(json, map, options);
	worker.postMessage(request);

	const result = await execution.promise;
	checkOptimizerResult(result, project);
	writeToTemplate(json, result);
	return json;
}

function createNonSkippingDistMap(distMap: DistMap, json: JProject): DistMap<number> {
	const ids = json.design.layout.flaps.map(f => f.id);
	const idMap = new Map<NodeId, number>();
	for(let i = 0; i < ids.length; i++) idMap.set(ids[i], i);
	return distMap.map(([i, j, d]) => [idMap.get(i)!, idMap.get(j)!, d]);
}

function createOptimizerRequest(json: JProject, map: DistMap<number>, options: OptimizerOptions): OptimizerRequest {
	const { flaps, sheet } = json.design.layout;
	options.callback({ event: "flap", data: flaps.length });
	flaps.forEach(f => f.width = f.height = 0);
	const { type } = sheet;

	const request: OptimizerRequest = {
		command: "start",
		layout: options.layout,
		fit: options.fit,
		random: options.random,
		type,
		flaps: flaps.map(f => ({ width: f.width, height: f.height })),
		vec: null,
		distMap: map,
	};

	if(options.layout == "view") {
		const { width, height } = sheet;
		request.vec = flaps.map(f => ({ x: f.x / width, y: f.y / height }));
	}
	return request;
}

function checkOptimizerResult(result: OptimizerResult, project: Project): void {
	if(!result) throw new Error("Problem not feasible.");
	project.design.layout.$sheet.grid.$fixDimension(result); // Fix dimensions that are too small.
	if(result.width > MAX_SHEET_SIZE || result.height > MAX_SHEET_SIZE) {
		throw new Error("Solution exceeds maximal sheet size."); // Just in case
	}
}

function writeToTemplate(json: JProject, result: OptimizerResult): void {
	const { flaps, sheet } = json.design.layout;
	json.design.layout = {
		sheet: {
			...sheet,
			width: result.width,
			height: result.height,
		},
		flaps: result.flaps.map((p, i) => ({ ...flaps[i], ...p })),
		stretches: [],
	};
	json.design.mode = "layout";
}
