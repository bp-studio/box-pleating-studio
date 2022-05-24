
declare const LZMA: {
	compress(s: string, level: number): Uint8Array;
	decompress(bytes: Uint8Array): string;
};

//=================================================================
/**
 * {@link LZ} 是 LZMA 程式庫的一個封裝
 *
 * 這個類別中的方法都假定了 LZMA 程式庫已經載入了。
 */
//=================================================================
namespace LZ {

	// atob 和 btoa 方法在 Node.js 當中是棄用的，但在前端環境中則否，
	// 因此底下的程式碼使用了 window.atob 等寫法來消音警告。
	// 參考：https://stackoverflow.com/a/70851350/9953396

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
