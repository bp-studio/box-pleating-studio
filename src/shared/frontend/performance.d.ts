interface Performance {
	/**
	 * Non-standard, Chromium only.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory
	 */
	readonly memory?: {
		readonly jsHeapSizeLimit: number;
		readonly totalJSHeapSize: number;
		readonly usedJSHeapSize: number;
	};
}
