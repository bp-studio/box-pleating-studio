import type { Path } from "shared/types/geometry";
import type { Repository } from "core/design/layout/repository";
import type { Gadget } from "core/design/layout/pattern/gadget";
import type { AddOn } from "core/design/layout/pattern/addOn";
import type { Pattern } from "core/design/layout/pattern/pattern";
import type { Strategy } from "./enum";
import type { JOverlap, JQuadrilateral } from "./layout";

export interface JStretch {
	/** Comma-separated, sorted ids of flaps involved. */
	id: string;

	/** `undefined` if there's no {@link Pattern} */
	configuration?: JConfiguration;

	/** `undefined` if there's no {@link Pattern} */
	pattern?: JPattern;

	/** `undefined` if the repo is not completely calculated. */
	repo?: JRepository;
}

/**
 * Store all information about the {@link Repository} for session.
 *
 * It would not suffice to simply store the config/pattern counts and indices,
 * since the generated config/pattern could be different across different versions.
 * We therefore store the entire config/pattern hierarchy just to be sure.
 */
export interface JRepository {
	configurations: Required<JConfiguration>[];
	index: number;
}

export interface JConfiguration {
	/** All Partitions in this Configuration */
	partitions: readonly JPartition[];

	/** Indicating that the {@link JPartition}s have {@link JOverlap.id}. */
	raw?: boolean;

	/** For session only. */
	patterns?: JPattern[];

	/** For session only. */
	index?: number;
}

export interface JJunction extends JQuadrilateral {
	/** The width of the flap rectangle (FR); always positive. */
	sx: number;

	/** Coefficients of transformation. */
	f: IPoint;
}

export type JJunctions = readonly JJunction[];

export interface JPartition {
	/** All Overlaps in this Partition */
	overlaps: readonly JOverlap[];

	/** The generating {@link Strategy} used by this Partition */
	strategy?: Strategy;
}

export interface JPattern {
	devices: readonly JDevice[];
}

export interface JDevice {
	gadgets: readonly JGadget[];
	offset?: number;
	addOns?: readonly JAddOn[];
}

export interface JAddOn {
	contour: Path;
	dir: IPoint;
}

export interface JGadget {

	/** All {@link Piece}s that form the current {@link Gadget} */
	pieces: readonly JPiece[];

	/** The relative offset of the {@link Gadget} to the `p[0]` of its first {@link Piece} */
	offset?: IPoint;

	/**
	 * Pay attention that the {@link anchors} are in opposite ordering from a {@link JOverlap},
	 * that is, the one of index 0 is the lower left corner.
	 */
	anchors?: JAnchor[];
}

/**
 * An anchor point is a corner on a {@link Gadget} that connects to an outer ridge
 * (possibly degenerated). Usually it is one of the original corners
 * of the gadget, but for joined gadgets it could be a corner of an {@link AddOn}
 * (as in the case of general joins), or a corner of another gadget
 * (as in the case of relay joins).
 */
export interface JAnchor {
	/**
	 * The slack that needs to be kept when connecting.
	 *
	 * We need to specify this only if the slack cannot be inferred from the constraints of partitions.
	 */
	slack?: number;

	/** Customize Anchor position. If not assigned, it will be inferred from the Gadget. */
	location?: IPoint;
}

export interface JPiece {
	/** The width of the corresponding overlap rectangle (OR). */
	ox: number;

	/** The height of the corresponding overlap rectangle (OR). */
	oy: number;

	/** The width of the margin rectangle (MR). */
	u: number;

	/** The height of the margin rectangle (MR). */
	v: number;

	/** Detour in clockwise direction. The coordinates are before adding the shift. */
	detours?: Path[];

	/**
	 * The relative shifting of this Piece to the reference point (before transformation) of the Partition.
	 *
	 * This includes the shifting of non-integral solutions, or the shifting in complex joins.
	 */
	shift?: IPoint;
}
