
import { callWorker } from "./workerUtility";

let worker: Worker;

type List = Record<string, string>;

export async function load(buffer: ArrayBuffer): Promise<List> {
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

export async function save(files: List): Promise<Blob> {
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
