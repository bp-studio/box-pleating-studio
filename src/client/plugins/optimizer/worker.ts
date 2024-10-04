///<reference lib="WebWorker" />

import "shared/polyfill/fromEntries";

import type { OptimizerRequest, OptimizerResult } from "./types";
import type { loadPyodide as LoadPyodide } from "pyodide";
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
			postMessage({ loading: progress });
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

async function init(): Promise<Optimizer> {
	console.log("Loading Pyodide");
	const [pyodide, buffer] = await Promise.all([
		loadPyodide({ stdout }),
		loadArchive(),
	]);
	await pyodide.loadPackage("scipy");
	pyodide.unpackArchive(buffer, "zip");
	const optimizer: Optimizer = await pyodide.pyimport("optimizer");
	console.log("Total loaded bytes: " + bytesLoaded);
	postMessage({ loading: HUNDRED });
	return optimizer;
}
const optimizerPromise = init();

/**
 * Currently there's only one type of interruption, that is skipping the current step.
 * Since the current support for interrupting Pyodide execution is quite limited
 * (either requires {@link SharedArrayBuffer} which has limited browser support,
 * or uses [JSPI](https://developer.chrome.com/blog/webassembly-jspi-origin-trial) which is even more limited),
 * for now we implement the "stop" mechanism simply by terminating the worker.
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
	if(data.command == "start") {
		try {
			shouldInterrupt = InterruptType.none;
			const optimizer = await optimizerPromise;
			const response = await optimizer.main({ checkInterrupt, ...data });
			const result = response?.toJs({
				dict_converter: Object.fromEntries,
			}) as OptimizerResult;
			postMessage({ result });
		} catch(e) {
			postMessage({ error: e });
		}
	}
	if(data.command == "skip") {
		shouldInterrupt = InterruptType.skip;
	}
});
