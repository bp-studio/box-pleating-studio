import type { Polygon, Contour, Path } from "shared/types/geometry";
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
	 * 物件的圖形資料。
	 *
	 * 須注意的是，**這裡面有可能會出現已經被刪除掉的物件**，
	 * 因此 Client 在使用這個資料的時候需要加以檢查。
	 */
	graphics: Record<string, GraphicsData>;
}

interface GraphicsData {
	contours?: Contour[];
}
