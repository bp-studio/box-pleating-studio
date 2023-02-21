// For Safari < 12.1

//=================================================================
/**
 * Polyfill for {@link globalThis}.
 */
//=================================================================
if(typeof globalThis === "undefined") {
	Object.defineProperty(window, "globalThis", {
		value: window,
		writable: false,
	});
}

export {};
