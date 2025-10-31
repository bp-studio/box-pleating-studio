import { describe } from "@rstest/core";

import binarySearchTreeSpec from "./binarySearchTree.test";
import heapSpec from "./heap.test";
import intDoubleMapSpec from "./intDoubleMap.test";
import valuedIntDoubleMapSpec from "./valuedIntDoubleMap.test";

describe("Data structures", () => {

	describe("Binary Search Tree", binarySearchTreeSpec);

	describe("Heap", heapSpec);

	describe("Int Double Map", intDoubleMapSpec);

	describe("Valued Int Double Map", valuedIntDoubleMapSpec);

});
