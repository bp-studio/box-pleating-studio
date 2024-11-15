import { MAX_SHEET_SIZE } from "shared/types/constants";
import { hasBigInt64Array, hasSharedArrayBuffer, isPlaywright } from "app/shared/constants";
import { display } from "client/screen/display";

import type { Hierarchy } from "core/design/context/areaTree/utils";
import type { OptimizerEvent, OptimizerRequest, OptimizerResult, OptimizerOptionsBase, OptimizerCommand } from "./types";
import type { JFlap, JProject, JSheet, NodeId } from "shared/json";
import type { Project } from "client/project/project";

let workerReady: PromiseWithResolvers<Worker>;

const interruptBuffer = new Uint8Array(hasSharedArrayBuffer ? new SharedArrayBuffer(1) : []);
const SIGINT = 2;
const SIGABRT = 6;
const COMPLETE = 100;

export function initOptimizerWorker(): void {
	if(!hasBigInt64Array) return;

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
			if(ev.data.event == "initError") {
				workerReady.reject(new Error("initError"));
			}
			if(ev.data.event == "loading") {
				loading = ev.data.data;
				if(loading == COMPLETE) workerReady.resolve(worker);
			}
			callback?.(ev.data);
		}
	};
}

// For some reason, loading the optimizer leads to crashes in Playwright webkit.
if(!isPlaywright) initOptimizerWorker();

let loading: number = 0;
let callback: OptimizerCallback;
let execution: PromiseWithResolvers<OptimizerResult>;

/** Callback for showing the progress of optimizer. */
export type OptimizerCallback = Consumer<OptimizerEvent>;

export interface OptimizerOptions extends OptimizerOptionsBase {
	useDimension: boolean;
	openNew: boolean;
	random: number;
}

function handler(command: OptimizerCommand, worker: Worker): void {
	if(command == "skip" && hasSharedArrayBuffer) {
		interruptBuffer[0] = SIGINT;
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

export async function optimizer(project: Project, options: OptimizerOptions, cb: OptimizerCallback): Promise<JProject> {
	callback = cb;
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
	const hierarchies = await project.$core.tree.getHierarchy(options.layout == "random", options.useDimension);
	const request = createOptimizerRequest(json, hierarchies, options);
	worker.postMessage(request);

	const result = await execution.promise;
	checkOptimizerResult(result, project);

	if(!options.openNew) await writeToProject(project, request, result);
	else writeToTemplate(json, request, result);
	return json;
}

function createOptimizerRequest(json: JProject, hierarchies: Hierarchy[], options: OptimizerOptions): OptimizerRequest {
	const { flaps, sheet } = json.design.layout;
	callback({ event: "flap", data: flaps.length });
	if(!options.useDimension) flaps.forEach(f => f.width = f.height = 0);
	const { type } = sheet;

	const flapMap = new Map<NodeId, JFlap>();
	for(const f of flaps) {
		flapMap.set(f.id, f);
	}
	const orderedFlaps = hierarchies[hierarchies.length - 1].leaves.map(id => flapMap.get(id)!);

	const request: OptimizerRequest = {
		command: "start",
		useBH: options.useBH,
		layout: options.layout,
		random: options.random,
		problem: {
			type,
			flaps: orderedFlaps.map(f => ({ id: f.id, width: f.width, height: f.height })),
			hierarchies,
		},
		vec: null,
	};
	if(options.layout == "view") request.vec = makeInitialVector(orderedFlaps, sheet);
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

/** Performs basic validity checks on the {@link OptimizerResult}. */
function checkOptimizerResult(result: OptimizerResult, project: Project): void {
	if(!result) throw new Error("Optimizer fails to solve the layout.");
	project.design.layout.$sheet.grid.$fixDimension(result); // Fix dimensions that are too small.

	// The following shouldn't happen, but we safe-guard them here anyway.
	if(
		!Number.isInteger(result.width) ||
		!Number.isInteger(result.height) ||
		result.flaps.some(f => !Number.isInteger(f.x) || !Number.isInteger(f.y))
	) {
		throw new Error("Optimizer returns a non-integer result.");
	}
	if(result.width > MAX_SHEET_SIZE || result.height > MAX_SHEET_SIZE) {
		throw new Error("Solution exceeds maximal sheet size.");
	}
}

function writeToTemplate(json: JProject, request: OptimizerRequest, result: OptimizerResult): void {
	const { sheet } = json.design.layout;
	json.design.layout = {
		sheet: {
			...sheet,
			width: result.width,
			height: result.height,
		},
		flaps: result.flaps.map(f => ({
			...f,
			...request.problem.flaps.find(r => r.id == f.id)!,
		})),
		stretches: [],
	};
	json.design.mode = "layout";
}

function writeToProject(proj: Project, request: OptimizerRequest, result: OptimizerResult): Promise<void> {
	return display.shield(async () => {
		const layout = proj.design.layout;
		layout.$sheet.grid.$setDimension(result.width, result.height);

		for(const f of result.flaps) {
			const flap = layout.$flaps.get(f.id)!;
			const { width, height } = request.problem.flaps.find(r => r.id == f.id)!;
			flap.$manipulate(f.x, f.y, width, height);
		}
		await proj.design.$batchUpdateManager.$updateComplete;
	});
}
