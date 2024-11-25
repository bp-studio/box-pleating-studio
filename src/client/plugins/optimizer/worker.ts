///<reference lib="WebWorker" />

import "shared/polyfill/fromEntries";

import type { OptimizerRequest, OptimizerResult } from "./types";
import type { loadPyodide as LoadPyodide, PyodideInterface } from "pyodide";
import type { PyProxy } from "pyodide/ffi";

// Declare that we're in worker environment
declare const self: WorkerGlobalScope & typeof globalThis;
declare const loadPyodide: typeof LoadPyodide;

let bytesLoaded = 0;
const fetchOriginal = fetch;
const PROGRESS_STEP = 50;
const HUNDRED = 100;

if(typeof TransformStream != "undefined") {
	// This number should be updated whenever Pyodide updates
	const totalBytes = 72543188;

	let lastProgress = performance.now();

	function loadProgress(delta: number): void {
		bytesLoaded += delta;
		const now = performance.now();
		if(now - lastProgress > PROGRESS_STEP) {
			const progress = HUNDRED * bytesLoaded / totalBytes;
			postMessage({ event: "loading", data: progress });
			lastProgress = now;
		}
	}

	// Hack fetch
	self.fetch = async url => {
		const response = await fetchOriginal(url);
		const ts = new TransformStream({
			transform(chunk, ctrl) {
				loadProgress(chunk.byteLength);
				ctrl.enqueue(chunk);
			},
		});
		return new Response(response.body!.pipeThrough(ts), response);
	};
}

// In general we shouldn't update Pyodide unless there's a strong reason,
// such as fixing of critical bugs.
importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

interface Optimizer {
	main(data: OptimizerRequest): PyProxy;
	get_error(): string;
};

function stdout(msg: string): void {
	/// #if DEBUG
	console.log(msg);
	/// #endif
	if(msg.startsWith("{")) {
		postMessage(JSON.parse(msg));
	}
}

async function loadArchive(): Promise<ArrayBuffer> {
	const response = await fetchOriginal(new URL("./python/__init__.py", import.meta.url));
	return await response.arrayBuffer();
}

async function initPyodide(): Promise<PyodideInterface | null> {
	try {
		console.log("Loading Pyodide");
		const [pyodide, buffer] = await Promise.all([
			loadPyodide({ stdout }),
			loadArchive(),
		]);
		const pkg = pyodide.loadPackage("scipy");
		pyodide.unpackArchive(buffer, "zip"); // We can unpack while downloading packages
		await pkg;
		return pyodide;
	} catch(e) {
		initError ||= e instanceof Error ? e.message : "unknown error";
		return null;
	}
}

async function initOptimizer(): Promise<Optimizer | null> {
	try {
		const pyodide = await pyodidePromise;
		const optimizer: Optimizer = pyodide!.pyimport("optimizer");
		/// #if DEBUG
		console.log("Total loaded bytes: " + bytesLoaded);
		/// #endif
		postMessage({ event: "loading", data: HUNDRED });
		return optimizer;
	} catch(e) {
		initError ||= e instanceof Error ? e.message : "unknown error";
		console.log(initError);
		postMessage({ event: "initError" });
		return null;
	}
}

let initError: string | undefined;
const pyodidePromise = initPyodide();
const optimizerPromise = initOptimizer();

addEventListener("message", async event => {
	const data = event.data as OptimizerRequest;
	if(data.command == "buffer") {
		const pyodide = await pyodidePromise;
		if(!pyodide) return;
		pyodide.setInterruptBuffer(data.buffer!);
		/// #if DEBUG
		console.log("InterruptBuffer ready");
		/// #endif
	}
	if(data.command == "start") {
		try {
			const optimizer = await optimizerPromise;
			if(!optimizer) return;
			try {
				/// #if DEBUG
				console.log(data);
				/// #endif
				const response = optimizer.main(data);
				const result = response?.toJs({
					dict_converter: Object.fromEntries,
				}) as OptimizerResult;
				/// #if DEBUG
				console.log(result);
				/// #endif
				postMessage({ result });
			} catch(e) {
				console.log(e);
				postMessage({ error: optimizer.get_error() });
			}
		} catch(e) {
			const msg = e instanceof Error ? e.message : "unknown error";
			postMessage({ error: "Initialization failed: " + msg });
		}
	}
});
