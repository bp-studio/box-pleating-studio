import type { JStretch } from "./pattern";
import type { JEdge } from "./tree";
import type { JHistory } from "./history";
import type { JFlap, JSheet, JVertex } from "./components";

export interface JProject {
	/** File format version. */
	version: string;

	/** The design */
	design: JDesign;

	/** Editing history. @session */
	history?: JHistory;

	/** Editor state. @session */
	state?: JState;
}

export type DesignMode = "layout" | "tree";

export interface JDesign {

	/** Title of the design */
	title: string;

	/** Design description */
	description?: string;

	/** The current view of the design. */
	mode: DesignMode;

	/** Layout view; see {@link JLayout} for details. */
	layout: JLayout;

	/** Tree view */
	tree: JTree;
}

export interface JLayout {
	sheet: JSheet;
	flaps: JFlap[];
	stretches: JStretch[];
}

export interface JTree {
	sheet: JSheet;
	nodes: JVertex[];
	edges: JEdge[];
}

interface JState {
	layout: JViewport;
	tree: JViewport;
}

export interface JViewport {
	/** Current zooming. @session */
	zoom: number;

	/** Current scrolling position. @session */
	scroll: IPoint;
}
