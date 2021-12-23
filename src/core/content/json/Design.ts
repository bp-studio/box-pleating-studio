import type { JFlap, JSheet, JVertex } from "./Components";
import type { JHistory } from "./History";
import type { JStretch } from "./Pattern";
import type { JEdge } from "./Tree";

/**
 * "J" stands for JSON, and {@link JDesign} is the saving format of a {@link Design} (a.k.a. "Project").
 *
 * Being JSON format, it's easy to incorporate any Unicode characters.
 *
 * Entries marked with @session implies that it is for session only, and will not be included in the .bps file.
 */
export interface JDesign {

	/** Title of the design */
	title: string;

	/** Design description */
	description?: string;

	/** File format version. see {@link Migration.$getCurrentVersion}() for the latest version. */
	version: string;

	/** The current view of the design. */
	mode: DesignMode;

	/** Editing history. @session */
	history?: JHistory;

	/** Layout view; see {@link JLayout} for details. */
	layout: JLayout;

	/** Tree view */
	tree: {
		sheet: JSheet,
		nodes: JVertex[],
		edges: JEdge[]
	};
}

export type DesignMode = "layout" | "tree";

export interface JLayout {
	sheet: JSheet,
	flaps: JFlap[],
	stretches: JStretch[]
}
