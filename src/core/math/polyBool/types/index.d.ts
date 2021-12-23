import { Segment } from "./Segment";
import type { Point } from "./types";

export * from "./types";
export { Segment };

export interface Shape {
	segments: Segment[];
	inverted: boolean;
}


export interface Combined {
	combined: Segment[];
	inverted1: boolean;
	inverted2: boolean;
}

export interface XEvent {
	isStart: boolean;
	pt: Point;
	seg: Segment;
	primary: boolean;
	other: XEvent;
	status: XEvent | null;
}

export interface Transition {
	before: XEvent | null;
	after: XEvent | null;
	insert(node: XEvent): XEvent;
}
