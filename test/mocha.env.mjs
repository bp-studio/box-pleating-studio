import { Assertion, expect } from "chai";

process.env.NODE_ENV = "test";
process.env.TS_NODE_PROJECT = "test/tsconfig.json";

globalThis.Assertion = Assertion;
globalThis.expect = expect;
