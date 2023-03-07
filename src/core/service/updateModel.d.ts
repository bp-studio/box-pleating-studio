import type { Polygon, Contour, Path, ILine } from "shared/types/geometry";
import type { JEdge, JEdgeBase, JFlap, JStretch } from "shared/json";

export interface UpdateModel {

	add: {
		nodes: number[];
		edges: JEdge[];
		junctions: Record<string, Polygon>;
		stretches: Record<string, JStretch>;
	};

	remove: {
		nodes: number[];
		edges: JEdgeBase[];
		junctions: string[];
		stretches: string[];
	};

	/**
	 * Graphics data of objects.
	 *
	 * Note that **there could be objects that are deleted later**,
	 * so the Client will need to check before using the data.
	 */
	graphics: Record<string, GraphicsData>;
}

interface GraphicsData {
	contours?: Contour[];
	ridges?: ILine[];
}
