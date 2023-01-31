import type { Polygon } from "shared/types/geometry";
import type { JEdge, JEdgeBase } from "shared/json";

export interface UpdateModel {

	add: {
		nodes: number[];
		edges: JEdge[];
	};

	remove: {
		nodes: number[];
		edges: JEdgeBase[];
	};

	graphics: Record<string, GraphicsData>;
}

interface GraphicsData {
	contours?: Contour[];
}
