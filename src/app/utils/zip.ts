
import type { Unzipped } from "fflate";

type List = Record<string, string>;

//=================================================================
/**
 * {@link Zip} is a wrapper for the zip library.
 *
 * Originally BP Studio uses [jsZip](https://stuk.github.io/jszip/),
 * but then migrated to [fflate](https://github.com/101arrowz/fflate)
 * which out-performs the former in every way.
 */
//=================================================================
namespace Zip {
	/**
	 * Unzip a given zip file, and returns a filename-content dictionary.
	 */
	export async function decompress(buffer: ArrayBuffer): Promise<List> {
		const { unzip } = await import(/* webpackChunkName: "zip" */ "fflate");
		const array = new Uint8Array(buffer);
		const unzipped = await new Promise<Unzipped>((resolve, reject) => {
			unzip(array, {}, (err, unzipData) => {
				if(err) reject(err);
				else resolve(unzipData);
			});
		});
		const files: List = {};
		const decoder = new TextDecoder();
		for(const file in unzipped) {
			files[file] = decoder.decode(unzipped[file]);
		}
		return files;
	}

	/**
	 * Create a zip file using the given filename-content dictionary.
	 */
	export async function compress(files: List): Promise<Blob> {

		const { zip } = await import(/* webpackChunkName: "zip" */ "fflate");
		const encoder = new TextEncoder();
		const data: Record<string, Uint8Array> = {};
		for(const file in files) {
			data[file] = encoder.encode(files[file]);
		}
		const result = await new Promise<Uint8Array>((resolve, reject) => {
			zip(data, {}, (err, zipData) => {
				if(err) reject(err);
				else resolve(zipData);
			});
		});
		const blob = new Blob([result], { type: "application/bpstudio.workspace+zip" });
		return blob;
	}
}

export default Zip;
