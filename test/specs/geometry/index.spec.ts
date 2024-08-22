import arcSpec from "./arc.spec";
import lineSpec from "./line.spec";
import polyBoolSpec from "./polyBool.spec";
import sweepLineSpec from "./sweepLine.spec";
import matrixSpec from "./matrix.spec";
import polygonSpec from "./polygon.spec";

describe("Geometry", function() {

	describe("Arc", arcSpec);

	describe("Matrix", matrixSpec);

	describe("Line", lineSpec);

	describe("PolyBool", polyBoolSpec);

	describe("Polygon", polygonSpec);

	describe("Sweep-line algorithms", sweepLineSpec);

});
