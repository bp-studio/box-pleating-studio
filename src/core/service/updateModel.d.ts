import type { Polygon } from "shared/types/geometry";
import type { JEdge } from "shared/json";

export interface UpdateModel {

	add: {
		nodes: number[];
		edges: JEdge[];
	};

	remove: {
		nodes: number[];
		edges: number[];
	};

	graphics: Record<string, GraphicsData>;
}

interface GraphicsData {
	contours?: Contour[];
}
