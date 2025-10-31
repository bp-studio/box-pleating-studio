import { describe } from "@rstest/core";

import arraySpec from "./array.test";
import cloneSpec from "./clone.test";
import copySpec from "./copy.test";

describe("Utility", () => {

	describe("Array utility", arraySpec);

	describe("Clone utility", cloneSpec);

	describe("Copy utility", copySpec);

});
