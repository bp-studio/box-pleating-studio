import { Assertion, expect } from "chai";

// Due to the limitation of chai v5 + ts-node,
// anything imported from a .js or .mjs file has to be done here.
import optimizer from "../lib/optimizer/debug/optimizer.mjs";

process.env.NODE_ENV = "test";
process.env.TS_NODE_PROJECT = "test/tsconfig.json";

globalThis.Assertion = Assertion;
globalThis.expect = expect;
globalThis.optimizer = optimizer;
