import { readFile } from "fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readFileAsync(path: string): Promise<string> {
	return new Promise((resolve, reject) => {
		readFile(__dirname + "/../samples/" + path, (err, data) => {
			if(err) reject(err);
			else resolve(data.toString());
		});
	});
}

const cache = new Map<string, string>();

export async function getText(path: string): Promise<string> {
	if(cache.has(path)) return cache.get(path)!;
	const data = await readFileAsync(path);
	cache.set(path, data);
	return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getJSON(path: string): Promise<any> {
	const data = await getText(path);
	return JSON.parse(data);
}
