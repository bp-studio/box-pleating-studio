// For Chrome < 73, Safari < 13

//=================================================================
/**
 * Polyfill for the native {@link String.matchAll} in ES2020.
 * https://caniuse.com/mdn-javascript_builtins_string_matchall
 */
//=================================================================
export function* matchAll(
	str: string,
	regexp: RegExp | string
): Generator<RegExpExecArray, void, undefined> {
	if(typeof regexp == "string") {
		regexp = new RegExp(regexp, "g");
	} else if(!regexp.global) {
		throw new TypeError("matchAll must be called with a global RegExp");
	}
	// Use a copy, so that the lastIndex of the original is untouched.
	const re = new RegExp(regexp, regexp.flags);
	re.lastIndex = regexp.lastIndex;
	let match: RegExpExecArray | null;
	while((match = re.exec(str)) !== null) {
		yield match;
		// Advance manually for empty matches, or it will loop forever.
		if(match[0] === "") re.lastIndex += advance(str, re);
	}
}

/** The largest code point that takes only one UTF-16 code unit. */
const MAX_BMP = 0xffff;

function advance(str: string, re: RegExp): number {
	if(!re.unicode) return 1;
	const code = str.codePointAt(re.lastIndex);
	return code !== undefined && code > MAX_BMP ? 2 : 1;
}

/* istanbul ignore next: polyfill */
if(typeof String.prototype.matchAll !== "function") {
	Object.defineProperty(String.prototype, "matchAll", {
		enumerable: false,
		writable: true,
		configurable: true,
		value(this: string, regexp: RegExp | string) {
			return matchAll(String(this), regexp);
		},
	});
}
