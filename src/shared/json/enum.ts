import type { JOverlap } from "./layout";

/**
 * How the gadget of a {@link JOverlap} is generated.
 * If omitted, integral GOPS gadgets are generated.
 */
export enum GadgetStrategy {
	halfIntegral = "HALFINTEGRAL",
	universal = "UNIVERSAL",
}

/** How a {@link JOverlap} joins onto another {@link JOverlap}. */
export enum JoinStrategy {
	/** Simple joins where the axis-parallel creases are not parallel. */
	simple = "SIMPLE",
	/** Simple joins where the axis-parallel creases are parallel. */
	perfect = "PERFECT",
	baseJoin = "BASE_JOIN",
	standardJoin = "STANDARD_JOIN",
}

export enum GridType {
	rectangular = "rect",
	diagonal = "diag",
}

export enum CommandType {
	field = 0,
	move = 1,
	edit = 2,
}

/** The connection type of a corner */
export enum CornerType {
	/** It is the connection target of another Overlap. */
	socket,
	/** It connects to another Overlap. */
	internal,
	/**
	 * The side corner, which also connects to a hinge intersection.
	 * However it could extend indefinitely since its on the very side.
	 */
	side,
	/**
	 * A corner that connects to a hinge intersection.
	 * In this case, `e` refers to the id of the other flap involved.
	 */
	intersection,
	/** A conner that connects to a flap. */
	flap,
	/**
	 * This corner coincides with another corner of another Overlap, which makes
	 * the current overlap belong to the same Partition as the former.
	 */
	coincide,
}
