///<reference lib="WebWorker" />

import "shared/polyfill/withResolvers";

import module from "lib/optimizer/dist/optimizer";
import { Bridge } from "./bridge";

import type { OptimizerRequest } from "./types";

const asyncMode = typeof SharedArrayBuffer == "undefined";

try {
	const instance = await module({
		print: (msg: string) => {
			/// #if DEBUG
			console.log(msg);
			/// #endif
			if(msg.startsWith("NLopt")) postMessage({ event: "init" });
			if(msg.startsWith("{")) postMessage(JSON.parse(msg));
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
	const bridge = new Bridge(instance, asyncMode);

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
