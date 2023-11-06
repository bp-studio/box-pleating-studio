import type { NodeId } from "./tree";
import type { GridType } from "./enum";

export interface JFlap extends IDimension, Writeable<IPoint> {
	id: NodeId;
}

export interface JSheet extends IDimension {
	type: GridType;
}

export interface JVertex extends Writeable<IPoint> {
	id: NodeId;
	name: string;

	/**
	 * Explicity indicating that this vertex has just been created,
	 * and will effect the corresponding flap location before switching view.
	 */
	isNew?: boolean;
}
