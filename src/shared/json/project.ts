import type { JStretch } from "./pattern";
import type { JEdge } from "./tree";
import type { JHistory } from "./history";
import type { JFlap, JSheet, JVertex } from "./components";

export type ProjId = TypedNumber<"ProjId">;

export interface JProject {
	/** File format version. */
	version: string;

	/** The design */
	design: JDesign;

	/** For log file. */
	error?: CoreError;

	/** Editing history. @session */
	history?: JHistory;

	/** Editor state. @session */
	state?: JState;
}

export type JProjectLike = RecursivePartial<JProject>;

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

export interface JState {
	layout: JViewport;
	tree: JViewport;
}

export interface JViewport {
	/** Current zooming. @session */
	zoom: number;

	/** Current scrolling position. @session */
	scroll: IPoint;
}

export interface CoreError {
	/** Error message itself. */
	message: string;

	/** Stack trace in the Core. */
	coreTrace: string;

	/** Stack trace in the client. */
	clientTrace: string;

	/** Last request sent to the Core. */
	request: object;

	/** Build version. */
	build: string;

	/** Information about the device, for diagnosing performance issues. */
	device: DeviceInfo;

	/** The timeout (in milliseconds) applied to the Core requests. */
	timeout: number;

	/**
	 * The most recent completed requests to the Core (oldest first),
	 * for estimating the computing power of the device.
	 */
	recentCalls: CoreCallRecord[];
}

/**
 * Note that the values reported by the browser are only approximations, and
 * some of them may be unavailable or deliberately coarsened.
 */
export interface DeviceInfo {
	/** Same as {@link Navigator.userAgent}. */
	userAgent: string;

	/** Same as {@link Navigator.deviceMemory} (in GB, capped at 8). */
	deviceMemory?: number;

	/** Same as {@link Navigator.hardwareConcurrency} (logical cores). */
	concurrency?: number;

	/** Whether the device is considered low-end by BP Studio. */
	lowEnd: boolean;

	/** Whether the device is a touch-only device. */
	touch: boolean;

	/** Whether running in an in-app browser. */
	inApp: boolean;

	/** Screen size in CSS pixels, and the device pixel ratio. */
	screen: { width: number, height: number, pixelRatio: number };

	/** Size of the browser viewport in CSS pixels. */
	viewport: { width: number, height: number };

	/**
	 * The GPU renderer reported by WebGL. A software renderer (for example
	 * SwiftShader) indicates that hardware acceleration is unavailable.
	 */
	gpu?: string;

	/** JS heap usage of the main thread in MB (Chromium only). */
	heap?: { used: number, limit: number };

	/** Time (in milliseconds) since the page was loaded. */
	uptime: number;

	/** The number of opened projects (each having its own Core worker). */
	projects: number;

	/**
	 * Whether the page is visible and focused at the time of reporting.
	 * Browsers may throttle hidden pages.
	 */
	visible: boolean;
	focused: boolean;
}

export interface CoreCallRecord {
	/** In the form `controller.action`. */
	route: string;

	/** Time (in milliseconds) spent by the Core on the request. */
	core: number;

	/**
	 * Time (in milliseconds) from sending the request to receiving the
	 * response, which also includes the time waiting in the queue.
	 */
	wall: number;
}
