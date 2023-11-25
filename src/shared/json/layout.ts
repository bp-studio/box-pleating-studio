import type { NodeId } from "./tree";
import type { QuadrantDirection } from "shared/types/direction";
import type { CornerType } from "./enum";
import type { JConfiguration, JJunction } from "./pattern";

export interface JQuadrilateral {
	/** The for quadrant corners of this {@link JQuadrilateral}, in the direction before the transformation. */
	c: JCorner[];

	ox: number;
	oy: number;
}

//=================================================================
/**
 * {@link JOverlap} is the basic component of a {@link Configuration}.
 * It is a region that is cut off from a {@link JJunction}.
 *
 * In the basic cases it represents a rectangular overlapping region,
 * but in the case of joins, it could become an arbitrary quadrilateral,
 * yet in any case it has four quadrant corners.
 */
//=================================================================

export interface JOverlap extends JQuadrilateral {

	/**
	 * An {@link OverlapId} that is unique during generation of {@link JConfiguration}.
	 * Used for temporarily identifying each overlap.
	 */
	id?: OverlapId;

	/** The index within {@link Configuration.$junctions} of the {@link JJunction} from which this {@link JOverlap} is cut off. */
	parent: number;

	/**
	 * The regular shift of self relative to the `p[0]` corner (upper right) of parent.
	 * If omitted, it would be (0, 0). */
	shift?: IPoint;
}

/** A negative number. */
export type OverlapId = TypedNumber<"OverlapId">;

//=================================================================
/**
 * {@link JCorner} is a quadrant corner of a {@link JQuadrilateral}.
 *
 * It describes the state of itself and the target it connects to.
 * It extends {@link Partial}<{@link JConnection}> interface,
 * and if {@link JCorner.e e} and {@link JCorner.q q} are `undefined` then it means it does not connect to anything.
 */
//=================================================================

export interface JCorner extends Partial<JConnection> {

	/** The type of the corner */
	type: CornerType;

	/**
	 * This is for future use in complex joins.
	 *
	 * When three or four vertices of Overlaps coincides at one point,
	 * the side vertices will exhibit dynamic behaviors.
	 * To make such a state easier to represent, we set the type of those two side vertices to none,
	 * and then annotate the two side vertices on the connecting vertex.
	 * When actually drawing, the dynamic behavior will be implemented based on which side vertex is closer.
	 */
	dynamic?: [JConnection, JConnection];
}

//=================================================================
/**
 * {@link JConnection} represents a connection.
 */
//=================================================================

export interface JConnection {

	/**
	 * The target it connects to.
	 * Non-negative integer represents flap,
	 * while negative integer represents Overlap (the id of it in the {@link JConfiguration}).
	 */
	e: NodeId | OverlapId;

	/**
	 * To which quadrant corner it connects.
	 *
	 * In the case of flaps its the original quadrant direction,
	 * and in the case of Overlaps its the untransformed direction.
	 */
	q: QuadrantDirection;
}
