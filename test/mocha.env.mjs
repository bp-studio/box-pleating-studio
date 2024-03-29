import { Assertion, expect } from "chai";

process.env.NODE_ENV = "test";
process.env.TS_NODE_PROJECT = "test/tsconfig.json";

globalThis.DEBUG_ENABLED = true;
globalThis.TEST_MODE = true;

globalThis.Assertion = Assertion;
globalThis.expect = expect;
