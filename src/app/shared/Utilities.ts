///////////////////////////////////////////////////
// 公用函數
///////////////////////////////////////////////////

function zoomStep(zoom: number): number {
	const FULL_ZOOM = 100, ZOOM_STEP = 25;
	return 2 ** Math.floor(Math.log2(zoom / FULL_ZOOM)) * ZOOM_STEP;
}

///////////////////////////////////////////////////
// 檔案處理
///////////////////////////////////////////////////

function sanitize(filename: string): string {
	let c = '/\\:*|"<>'.split(''), r = "∕∖∶∗∣″‹›".split('');
	for(let i in c) filename = filename.replace(RegExp("\\" + c[i], "g"), r[i]);
	return filename
		.replace(/\?/g, "ʔ̣")
		.replace(/\s+/g, " ")
		// eslint-disable-next-line no-control-regex
		.replace(/[\x00-\x1f\x80-\x9f]/g, "")
		.replace(/^\.*$/, "project")
		.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, "project")
		.replace(/[. ]+$/, "project");
}

function readFile(file: File): Promise<ArrayBuffer> {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onload = e => resolve(e.target!.result as ArrayBuffer);
		reader.onerror = e => reject(e);
		reader.readAsArrayBuffer(file); // readAsText 可能無法完整讀取 binary 檔案
	});
}

function bufferToText(buffer: ArrayBuffer): string {
	return new TextDecoder().decode(new Uint8Array(buffer));
}
