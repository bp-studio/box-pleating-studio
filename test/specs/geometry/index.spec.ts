import { describe } from "@rstest/core";

import arcSpec from "./arc.test";
import lineSpec from "./line.test";
import polyBoolSpec from "./polyBool.test";
import sweepLineSpec from "./sweepLine.test";
import matrixSpec from "./matrix.test";
import polygonSpec from "./polygon.test";

describe("Geometry", () => {

	describe("Arc", arcSpec);

	describe("Matrix", matrixSpec);

	describe("Line", lineSpec);

	describe("PolyBool", polyBoolSpec);

	describe("Polygon", polygonSpec);

	describe("Sweep-line algorithms", sweepLineSpec);

});
