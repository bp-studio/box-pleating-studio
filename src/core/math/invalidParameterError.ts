import type { Fraction } from "./fraction";

//=================================================================
/**
 * {@link InvalidParameterError} is when the {@link Fraction} constructor gets
 * invalid parameters (usually means overflowing).
 */
//=================================================================

export class InvalidParameterError extends Error {
	constructor() {
		super("Parameters are not valid");
		/// #if DEBUG
		debugger;
		/// #endif
	}
}
