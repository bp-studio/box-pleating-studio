
import { callWorker } from "./workerUtility";

let worker: Worker;

type List = Record<string, string>;

//=================================================================
/**
 * {@link JSZip} is a wrapper for JSZip library.
 */
//=================================================================
namespace JSZip {
	/**
	 * Unzip a given zip file, and returns a filename-content dictionary.
	 */
	export async function decompress(buffer: ArrayBuffer): Promise<List> {
		worker ||= new Worker("lib/jszip.js");
		const blob = new Blob([buffer]);
		const url = URL.createObjectURL(blob);
		const result = await callWorker<List>(worker, {
			command: "load",
			payload: url,
		});
		URL.revokeObjectURL(url);
		return result;
	}

	/**
	 * Create a zip file using the given filename-content dictionary.
	 */
	export async function compress(files: List): Promise<Blob> {
		worker ||= new Worker("lib/jszip.js");
		const url = await callWorker<string>(worker, {
			command: "save",
			payload: files,
		});
		const response = await fetch(url);
		const blob = await response.blob();
		URL.revokeObjectURL(url);
		return blob;
	}
}

export default JSZip;
