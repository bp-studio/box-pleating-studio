
declare const LZMA: {
	compress(s: string, level: number): Uint8Array;
	decompress(bytes: Uint8Array): string;
};

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

	export function compress(s: string): string {
		const arr = LZMA.compress(s, 1); // Experiments showed that 1 is good enough
		s = window.btoa(String.fromCharCode.apply(null, Array.from<number>(Uint8Array.from(arr))));
		return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/[=]+/g, ""); // urlBase64
	}

	export function decompress(s: string): string {
		// There's no need to add padding "=" back since atob() can infer it.
		s = window.atob(s.replace(/-/g, "+").replace(/_/g, "/"));
		const bytes = new Uint8Array(s.length);
		for(let i = 0; i < bytes.length; i++) bytes[i] = s.charCodeAt(i);
		return LZMA.decompress(bytes);
	}
}

export default LZ;
