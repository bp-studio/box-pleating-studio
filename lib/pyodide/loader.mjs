import { readFile, readdir } from "fs/promises";
import { resolve } from "path";
import { zip } from "fflate";

const encoder = new TextEncoder();

/** @author ChatGPT */
function cleanPythonCode(code) {
	// Remove comments and docStrings
	code = code.replace(/(['"]{3})(?:[\s\S]*?)\1|(['"])(?:(?!\2)[^\\]|\\.)*\2| *#.*$/gm, (match, tripleQuote, quote) => {
		if(tripleQuote) return "";
		if(quote) return match;
		return "";
	});
	// Remove function type annotations
	code = code.replace(/^(\s*def\s+\w+)\(([^)]*)\)(?:\s*->\s*[^:]+)?:$/gm, (match, def, params) => {
		const cleanedParams = params.replace(/(\w+)\s*:\s*[^,)\n]+/g, "$1");
		return `${def}(${cleanedParams}):`;
	});
	return code;
}

async function addFile(path) {
	const buffer = await readFile(path);
	const code = buffer.toString("utf-8");
	const output = cleanPythonCode(code);
	return encoder.encode(output);
}

/**
 * @type {import("@rspack/core").LoaderDefinitionFunction}
 */
export default async function(content, map, meta) {
	const callback = this.async();

	const folder = resolve(this.resourcePath, "..");
	this.addContextDependency(folder);

	/** @type {import("fflate").AsyncZippable} */
	const data = {};
	const dir = await readdir(folder, { recursive: true });
	const tasks = [];
	for(const file of dir) {
		const path = resolve(folder, file);
		const task = addFile(path).then(arr => data["optimizer/" + file] = arr);
		tasks.push(task);
	}
	await Promise.all(tasks);

	/** @type {Promise<Uint8Array>} */
	const zipData = await new Promise((res, rej) => {
		zip(data, (err, data) => {
			if(err) rej(err);
			else res(data);
		});
	});
	callback(null, Buffer.from(zipData), map, meta);
};
