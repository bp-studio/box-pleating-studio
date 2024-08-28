/// <reference lib="esnext" />
/// <reference path="jszip.d.ts" />

import JSZip from "jszip/dist/jsZip.js";

onmessage = async event => {
	if(!event.ports[0]) return;
	if(event.data.command == "load") {
		const response = await fetch(event.data.payload);
		const buffer = response.arrayBuffer();
		const zip = await JSZip.loadAsync(buffer);
		const files: Record<string, string> = {};
		const tasks: Promise<void>[] = [];
		zip.forEach((path, file) => {
			tasks.push(file.async("text").then(t => {
				files[path] = t;
			}));
		});
		await Promise.all(tasks);
		event.ports[0].postMessage(files);
	} else {
		const jsZip = new JSZip();
		const files = event.data.payload as Record<string, string>;
		for(const file in files) jsZip.file(file, files[file]);
		const blob = await jsZip.generateAsync({
			type: "blob",
			compression: "DEFLATE",
			compressionOptions: { level: 9 },
		});
		const url = URL.createObjectURL(blob.slice(0, blob.size, "application/bpstudio.workspace+zip"));
		event.ports[0].postMessage(url);
	}
}
