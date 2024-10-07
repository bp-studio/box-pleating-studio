import { MAX_SHEET_SIZE } from "shared/types/constants";
import { hasSharedArrayBuffer } from "app/shared/constants";

import type { OptimizerEvent, OptimizerRequest, OptimizerResult, OptimizerOptionsBase, OptimizerCommand } from "./types";
import type { JFlap, JProject, JSheet } from "shared/json";
import type { DistMap } from "core/design/context/treeUtils";
import type { NodeId } from "shared/json/tree";
import type { Project } from "client/project/project";

let workerReady: PromiseWithResolvers<Worker>;

const interruptBuffer = new Uint8Array(hasSharedArrayBuffer ? new SharedArrayBuffer(1) : []);
const SIGINT = 2;
const SIGABRT = 6;
const COMPLETE = 100;

export function initOptimizerWorker(): void {
	workerReady = Promise.withResolvers<Worker>();
	const worker = new Worker(new URL("./worker.ts", import.meta.url), { name: "optimizer" });
	if(hasSharedArrayBuffer) {
		worker.postMessage({ command: "buffer", buffer: interruptBuffer });
	}

	worker.onmessage = ev => {
		if(!ev.data) return;
		if("result" in ev.data) execution.resolve(ev.data.result);
		if("error" in ev.data) execution.reject(ev.data.error);
		if("event" in ev.data) {
			if(ev.data.event == "loading") {
				loading = ev.data.data;
				if(loading == COMPLETE) workerReady.resolve(worker);
			}
			callback?.(ev.data);
		}
	};
}

initOptimizerWorker();

let loading: number = 0;
let callback: Consumer<OptimizerEvent>;
let execution: PromiseWithResolvers<OptimizerResult>;

export interface OptimizerOptions extends OptimizerOptionsBase {
	useDimension: boolean;
	random: number;

	/** Callback for showing the progress of optimizer. */
	callback: Consumer<OptimizerEvent>;
}

function handler(command: OptimizerCommand, worker: Worker): void {
	if(command == "skip") {
		if(hasSharedArrayBuffer) interruptBuffer[0] = SIGINT;
		else worker.postMessage({ command }); // fallback
	} else if(command == "stop") {
		if(hasSharedArrayBuffer) {
			interruptBuffer[0] = SIGABRT;
		} else {
			execution.reject();
			worker.terminate();
			initOptimizerWorker();
		}
	}
}

export async function optimizer(project: Project, options: OptimizerOptions): Promise<JProject> {
	callback = options.callback;
	const init = Promise.withResolvers<Worker>();
	callback({
		event: "handle",
		data: command => command == "stop" && init.reject(),
	});
	callback({ event: "loading", data: loading });
	const worker = await Promise.race([workerReady.promise, init.promise]);
	callback({
		event: "handle",
		data: command => handler(command, worker),
	});
	execution = Promise.withResolvers();

	if(hasSharedArrayBuffer) interruptBuffer[0] = 0;
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
	if(!options.useDimension) flaps.forEach(f => f.width = f.height = 0);
	const { type } = sheet;

	const request: OptimizerRequest = {
		command: "start",
		useBH: options.useBH,
		layout: options.layout,
		fit: options.fit,
		random: options.random,
		problem: {
			type,
			flaps: flaps.map(f => ({ width: f.width, height: f.height })),
			distMap: map,
		},
		vec: null,
	};
	if(options.layout == "view") request.vec = makeInitialVector(flaps, sheet);
	return request;
}

const OFFSET = 0.5;

function makeInitialVector(flaps: JFlap[], sheet: JSheet): IPoint[] {
	const { width, height } = sheet;
	const set = new Set<string>();
	return flaps.map(f => {
		const { x, y } = f;
		let key = x + "," + y;
		while(set.has(key)) {
			f.x = x + Math.random() - OFFSET;
			f.y = y + Math.random() - OFFSET;
			key = f.x + "," + f.y;
		}
		set.add(key);
		return { x: f.x / width, y: f.y / height };
	});
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
