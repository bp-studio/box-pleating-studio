///<reference lib="WebWorker" />

import { Bridge } from "./bridge";

import type { OptimizerRequest } from "./types";

// Decide the wasm build to use
const module = checkMPSupport() ?
	await import("lib/optimizer/dist_mp/optimizer") :
	await import("lib/optimizer/dist/optimizer");

try {
	// We explicitly pass this to Emscripten, preventing circular reference.
	const url = new URL("lib/optimizer/dist_mp/optimizer", import.meta.url).toString();

	const instance = await module.default({
		mainScriptUrlOrBlob: url,

		print: (msg: string) => {
			if(msg.startsWith("NLopt")) {
				console.log(msg);
				postMessage({ event: "init" });
			} else if(msg.startsWith("{")) {
				postMessage(msg); // Leave the parsing to the main thread
			} else {
				/// #if DEBUG
				console.log(msg);
				/// #endif
			}
		},
		printErr: (err: string) => postMessage({ error: err }),

		/////////////////////////////////////////////////////////////////////////

		checkInterruptAsync: () => new Promise(resolve => {
			interruptResolve = resolve;

			// if any message comes in when the thread is blocked,
			// it will be executed before setTimeout
			setTimeout(() => resolve(false), 0);
		}),
		checkInterrupt: () => {
			const result = buffer[0];
			buffer[0] = 0;
			return result;
		},
	});
	const bridge = new Bridge(instance);

	let interruptResolve = (_: boolean): void => { /* */ };
	let buffer: Uint8Array<ArrayBufferLike>;

	addEventListener("message", async event => {
		const data = event.data as OptimizerRequest;
		if(data.command == "buffer") {
			buffer = data.buffer!;
			/// #if DEBUG
			console.log("InterruptBuffer ready");
			/// #endif
		}
		if(data.command == "skip") interruptResolve(true);
		if(data.command == "start") {
			try {
				/// #if DEBUG
				console.log(data);
				/// #endif

				console.time("optimize");
				const result = await bridge.solve(data);
				console.log(result);
				console.timeEnd("optimize");

				postMessage({ result });
			} catch(e) {
				const msg = e instanceof Error ? e.message : "unknown error";
				postMessage({ error: msg });
			}
		}
	});
} catch(e) {
	const msg = e instanceof Error ? e.message : "unknown error";
	console.log(msg);
	postMessage({ event: "initError" });
}

/**
 * Check if multiple processing can be supported.
 */
function checkMPSupport(): boolean {
	// SharedArrayBuffer is required
	if(typeof SharedArrayBuffer === "undefined") return false;

	// SimpleOMP uses hardwareConcurrency as default thread pool size,
	// so it is necessary that it has a valid value greater than 1.
	if(!(navigator.hardwareConcurrency > 1)) return false;

	try {
		// check if nested worker is supported
		const blob = new Blob(["self.onmessage = () => {}"], { type: "application/javascript" });
		const url = URL.createObjectURL(blob);
		const worker = new Worker(url);
		worker.terminate();

		// Inform the UI that MP is supported
		postMessage({ event: "mp" });

		return true;
	} catch {
		return false;
	}
}
