
namespace FileUtility {

	/**
	 * Purge the filename string, so that in can be used safely in all OS.
	 */
	export function sanitize(filename: string): string {
		// replace illegal unicode characters with similar characters
		const c = '/\\:*|"<>?'.split(""), r = "∕∖∶∗∣″‹›？".split("");
		for(const i in c) filename = filename.replace(RegExp("\\" + c[i], "g"), r[i]);

		return filename
			.replace(/\s+/g, " ")
			// eslint-disable-next-line no-control-regex
			.replace(/[\x00-\x1f\x80-\x9f]/g, "") // Remove control characters
			.replace(/^\.*$/, "project")
			.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, "project")
			.replace(/[. ]+$/, "project");
	}

	/**
	 * Read the {@link File} object and returns {@link ArrayBuffer}。
	 */
	export function readFile(file: File): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = e => resolve(e.target!.result as ArrayBuffer);
			reader.onerror = e => reject(e);
			reader.readAsArrayBuffer(file); // readAsText may not be able to full read a binary file
		});
	}

	export function bufferToText(buffer: ArrayBuffer): string {
		return new TextDecoder().decode(new Uint8Array(buffer));
	}
}

export default FileUtility;
