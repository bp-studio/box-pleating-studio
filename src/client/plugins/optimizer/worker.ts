///<reference lib="WebWorker" />

import "shared/polyfill/fromEntries";

import type { OptimizerRequest, OptimizerResult } from "./types";
import type { loadPyodide as LoadPyodide, PyodideInterface } from "pyodide";
import type { PyProxy } from "pyodide/ffi";

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
	globalThis.fetch = async url => {
		// console.log("Worker fetch", url);
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

importScripts("https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js");

type MainParams = OptimizerRequest & {
	checkInterrupt: typeof checkInterrupt;
};

interface Optimizer {
	main(data: MainParams): Promise<PyProxy>;
	get_error(): string;
};

function stdout(msg: string): void {
	let data: unknown;
	/// #if DEBUG
	console.log(msg);
	/// #endif
	if(msg.startsWith("{")) {
		data = (JSON.parse(msg));
	} else {
		const match = msg.match(/basinhopping step (\d+)/);
		if(match) data = { event: "bhs", data: Number(match[1]) };
	}
	if(data) postMessage(data);
}

async function loadArchive(): Promise<ArrayBuffer> {
	const response = await fetchOriginal(new URL("./python/__init__.py", import.meta.url));
	return await response.arrayBuffer();
}

async function initPyodide(): Promise<PyodideInterface> {
	console.log("Loading Pyodide");
	const [pyodide, buffer] = await Promise.all([
		loadPyodide({ stdout }),
		loadArchive(),
	]);
	await pyodide.loadPackage("scipy");
	pyodide.unpackArchive(buffer, "zip");
	// console.log(pyodide.FS.readdir("optimizer"));
	return pyodide;
}

async function initOptimizer(): Promise<Optimizer> {
	const pyodide = await pyodidePromise;
	const optimizer: Optimizer = await pyodide.pyimport("optimizer");
	console.log("Total loaded bytes: " + bytesLoaded);
	postMessage({ event: "loading", data: HUNDRED });
	return optimizer;
}

const pyodidePromise = initPyodide();
const optimizerPromise = initOptimizer();

/**
 * This is the interruption fallback in case {@link SharedArrayBuffer} is not available
 * (for example iOS < 15.2).
 */
enum InterruptType {
	none = 0,
	skip = 1,
}

let shouldInterrupt = InterruptType.none;

function checkInterrupt(): Promise<InterruptType> {
	return new Promise(resolve => {
		setTimeout(() => {
			const value = shouldInterrupt;
			shouldInterrupt = InterruptType.none;
			resolve(value);
		}, 0);
	});
}

addEventListener("message", async event => {
	const data = event.data as OptimizerRequest;
	if(data.command == "buffer") {
		const pyodide = await pyodidePromise;
		pyodide.setInterruptBuffer(data.buffer!);
		console.log("InterruptBuffer ready");
	}
	if(data.command == "start") {
		shouldInterrupt = InterruptType.none;
		const optimizer = await optimizerPromise;
		try {
			const response = await optimizer.main({ checkInterrupt, ...data });
			const result = response?.toJs({
				dict_converter: Object.fromEntries,
			}) as OptimizerResult;
			postMessage({ result });
		} catch(e) {
			console.log(e);
			postMessage({ error: optimizer.get_error() });
		}
	}
	if(data.command == "skip") {
		shouldInterrupt = InterruptType.skip;
	}
});
