export enum Strategy {
	$halfIntegral = "HALFINTEGRAL",
	$universal = "UNIVERSAL",
	$baseJoin = "BASE_JOIN",
	$standardJoin = "STANDARD_JOIN",
	$perfect = "PERFECT",
}

export enum GridType {
	rectangular = "rect",
	diagonal = "diag",
}

export enum CommandType {
	field = 0,
	move = 1,
	add = 2,
	remove = 3,
}

/** The connection type of a corner */
export enum CornerType {
	/** It is the connection target of another Overlap. */
	$socket,
	/** It connects to another Overlap. */
	$internal,
	/**
	 * The side corner, which also connects to a hinge intersection.
	 * However it could extend indefinitely since its on the very side.
	 */
	$side,
	/**
	 * A corner that connects to a hinge intersection.
	 * In this case, `e` refers to the id of the other flap involved.= */
	$intersection,
	/** A conner that connects to a flap. */
	$flap,
	/**
	 * This corner coincides with another corner of another Overlap,
	 * which makes the current overlap belong to the same Partition as the former.
	 */
	$coincide,
}
