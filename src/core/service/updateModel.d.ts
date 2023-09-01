import type { Polygon, Contour, Path, ILine, ArcPolygon } from "shared/types/geometry";
import type { CommandType, JConfiguration, JEdge, JEdgeBase, JEdit, JFlap, JStretch } from "shared/json";
import type { Configuration } from "core/design/layout/configuration";
import type { Pattern } from "core/design/layout/pattern/pattern";
import type { Device } from "core/design/layout/pattern/device";

export interface UpdateModel {

	add: {
		nodes: number[];
		junctions: Record<string, ArcPolygon>;
		stretches: Record<string, JStretch>;
	};

	/** Record the entire tree when any part of it changes. */
	tree?: JEdge[];

	remove: {
		nodes: number[];
		junctions: string[];
		stretches: string[];
	};

	edit: JEdit[];

	/**
	 * Graphics data of objects.
	 *
	 * Note that **there could be objects that are deleted later**,
	 * so the Client will need to check before using the data.
	 */
	graphics: Record<string, GraphicsData>;
}

interface GraphicsData {
	/**
	 * Shaded region upon selection.
	 * For flaps and rivers, this also defines the hinges.
	 */
	contours: readonly Contour[];

	/**
	 * All ridges that should be drawn.
	 */
	ridges: readonly ILine[];
}

/**
 * Additional data only for {@link Device}s.
 */
interface DeviceData extends GraphicsData {
	/**
	 * All axis-parallel creases.
	 */
	axisParallel: readonly ILine[];

	/**
	 * Dragging range, represented by the lower/upper limit of
	 * deltaX after transformation.
	 */
	range: readonly [number, number];

	/**
	 * Current location of the {@link Device}.
	 */
	location: IPoint;

	/**
	 * Whether the overall direction is like a forward slash.
	 */
	forward: boolean;
}

