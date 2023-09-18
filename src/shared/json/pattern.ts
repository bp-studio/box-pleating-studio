import type { Strategy } from "./enum";
import type { JOverlap, JQuadrilateral } from "./layout";

export interface JStretch {
	/** Comma-separated ids of flaps involved. */
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
	/** The maximal space between the {@link Flap}s; always positive. */
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

export type JStructure = readonly Readonly<JJunction>[];

export interface JPattern {
	devices: readonly JDevice[];
}

export interface JDevice {
	gadgets: readonly JGadget[];
	offset?: number;
	addOns?: readonly JAddOn[];
}

export interface JAddOn {
	contour: IPoint[];
	dir: IPoint;
}

export interface JGadget {

	/** All {@link Piece}s that form the current {@link Gadget} */
	pieces: readonly JPiece[];

	/** The relative offset of the {@link Gadget} to the `p[0]` of its first {@link Piece} */
	offset?: IPoint;

	anchors?: JAnchor[];
}

export interface JAnchor {
	/** The slack that needs to be kept when connecting */
	slack?: number;

	/** Customize Anchor position. If not assigned, it will be inferred from the Gadget. */
	location?: IPoint;
}

export interface JPiece {
	ox: number;
	oy: number;
	u: number;
	v: number;

	/** Detour in clockwise direction. The coordinates are before adding the shift. */
	detours?: IPoint[][];

	/**
	 * The relative shifting of this Piece to the reference point (before transformation) of the Partition.
	 *
	 * This includes the shifting of non-integral solutions, or the shifting in complex joins.
	 */
	shift?: IPoint;
}
