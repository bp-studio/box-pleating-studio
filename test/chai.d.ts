import type * as chai from "chai";

declare global {
	declare const expect: typeof chai.expect;
	declare const Assertion: typeof chai.Assertion;
}
