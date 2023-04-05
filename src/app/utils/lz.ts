
let lzma_worker: Worker;
const callbacks: Record<number, Action> = {};

enum Act {
	compress = 1,
	decompress = 2,
	progress = 3,
}

function createCallbackNumber(): number {
	let cbn = 0;
	while(typeof callbacks[cbn] !== "undefined") cbn++;
	return cbn;
}

function callWorker<T>(action: Act, data: unknown, mode: unknown): Promise<T> {
	if(!lzma_worker) {
		lzma_worker = new Worker("lib/lzma_worker-min.js");
		lzma_worker.onmessage = e => {
			if(e.data.action !== Act.progress && callbacks[e.data.cbn]) {
				callbacks[e.data.cbn](e.data.result);
				delete callbacks[e.data.cbn];
			}
		};
	}
	const cbn = createCallbackNumber();
	return new Promise<T>(resolve => {
		callbacks[cbn] = resolve;
		lzma_worker.postMessage({
			action,
			cbn,
			data,
			mode,
		});
	});
}

//=================================================================
/**
 * {@link LZ} is a wrapper for LZMA library.
 *
 * The methods assumes that the library is loaded.
 */
//=================================================================
namespace LZ {

	// `atob` and `btoa` methods are deprecated in Node.js but not in frontend,
	// so we use window.atob etc. to silence warnings.
	// See https://stackoverflow.com/a/70851350/9953396

	export async function compress(s: string): Promise<string> {
		const arr = await callWorker<Uint8Array>(Act.compress, s, 1); // Experiments showed that 1 is good enough
		s = window.btoa(String.fromCharCode.apply(null, Array.from<number>(Uint8Array.from(arr))));
		return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/[=]+/g, ""); // urlBase64
	}

	export async function decompress(s: string): Promise<string> {
		// There's no need to add padding "=" back since atob() can infer it.
		s = window.atob(s.replace(/-/g, "+").replace(/_/g, "/"));
		const bytes = new Uint8Array(s.length);
		for(let i = 0; i < bytes.length; i++) bytes[i] = s.charCodeAt(i);
		return await callWorker<string>(Act.decompress, bytes, false);
	}
}

export default LZ;
