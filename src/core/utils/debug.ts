/**
 * Utilities for checking the invariants of the algorithms during development.
 *
 * All of them are no-op in production builds. In tests, a violation throws an
 * error, so that it gets noticed (`debugger` alone does nothing unless a
 * debugger is attached). Otherwise, it pauses in the debugger.
 *
 * In production builds, the bodies are removed by `ifdef-loader`, and the
 * minifier then eliminates the calls entirely, including their arguments (as
 * verified by searching the messages in the build output). So feel free to use
 * them anywhere, even in hot paths; just keep the arguments free of side
 * effects (e.g. pass the check as a function, and the message as a literal).
 */

/// #if DEBUG
interface ProcessLike {
	env?: Record<string, string | undefined>;
}

const isTest = Boolean(
	(globalThis as { process?: ProcessLike }).process?.env?.RSTEST
);
/// #endif

/**
 * Asserts that an invariant holds. The check is given as a function, so that
 * it is not evaluated at all in production builds.
 */
export function debugAssert(check: () => boolean, message: string): void {
	/// #if DEBUG
	/* istanbul ignore if: debug */
	if(!check()) debugFail(message);
	/// #endif
}

/** Reports that something that should never happen has happened. */
/* istanbul ignore next: debug */
export function debugFail(message: string): void {
	/// #if DEBUG
	if(isTest) throw new Error(`Debug assertion failed: ${message}`);
	console.warn(`Debug assertion failed: ${message}`);
	debugger;
	/// #endif
}

/**
 * Pauses in the debugger, except in tests, where the situation could be
 * intended (for example, an error that is thrown and caught on purpose).
 */
export function debugBreak(): void {
	/// #if DEBUG
	/* istanbul ignore if: debug */
	if(!isTest) debugger;
	/// #endif
}
