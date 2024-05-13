import arcSpec from "./arc.spec";
import lineSpec from "./line.spec";
import polyBoolSpec from "./polyBool.spec";
import sweepLineSpec from "./sweepLine.spec";
import matrixSpec from "./matrix.spec";

describe("Geometry", function() {

	describe("Arc", arcSpec);

	describe("Matrix", matrixSpec);

	describe("Line", lineSpec);

	describe("PolyBool", polyBoolSpec);

	describe("Sweep-line algorithms", sweepLineSpec);

});
