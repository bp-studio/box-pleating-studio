
namespace FileUtility {

	/**
	 * 淨化傳入的檔名字串，並傳回可以安全放在各種檔案系統當中的檔名。
	 */
	export function sanitize(filename: string): string {
		// 替換不合法字元成為相似的 unicode 字元
		const c = '/\\:*|"<>?'.split(""), r = "∕∖∶∗∣″‹›？".split("");
		for(const i in c) filename = filename.replace(RegExp("\\" + c[i], "g"), r[i]);

		return filename
			.replace(/\s+/g, " ")
			// eslint-disable-next-line no-control-regex
			.replace(/[\x00-\x1f\x80-\x9f]/g, "") // 移除控制字元
			.replace(/^\.*$/, "project")
			.replace(/^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i, "project")
			.replace(/[. ]+$/, "project");
	}

	/**
	 * 讀取 {@link File} 物件並且傳回 {@link ArrayBuffer}。
	 */
	export function readFile(file: File): Promise<ArrayBuffer> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = e => resolve(e.target!.result as ArrayBuffer);
			reader.onerror = e => reject(e);
			reader.readAsArrayBuffer(file); // readAsText 可能無法完整讀取 binary 檔案
		});
	}

	export function bufferToText(buffer: ArrayBuffer): string {
		return new TextDecoder().decode(new Uint8Array(buffer));
	}
}

export default FileUtility;
