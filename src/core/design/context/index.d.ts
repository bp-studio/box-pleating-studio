import type { Contour, ILine, Path, PathEx } from "shared/types/geometry";
import type { AABB } from "./aabb/aabb";
import type { IHeap, IReadonlyHeap } from "shared/data/heap/heap";
import type { TreeNode } from "./treeNode";
import type { JEdge, JFlap } from "shared/json";
import type { Repository } from "../layout/repository";
import type { clearPatternContourForRepo } from "../tasks/patternContour";
import type { NodeSet } from "../layout/nodeSet";
import type { Point } from "core/math/geometry/point";
import type { roughContourTask } from "core/design/tasks/roughContour";
import type { junctionTask } from "../tasks/junction";
import type { RoughContourContext } from "../tasks/roughContourContext";

export interface ITree {
	readonly $nodes: readonly (ITreeNode | undefined)[];

	readonly $root: ITreeNode;

	/** Deletes an leaf, and returns if the operation is successful */
	$removeLeaf(id: number): boolean;

	$setFlaps(flaps: JFlap[]): void;

	/** Delete a given node and join the two adjacent edges into one */
	$join(id: number): void;

	/** Split the parent edge of a node into two, and insert a new node*/
	$split(id: number, at: number): void;

	/** Merge the node with its parent */
	$merge(id: number): void;

	/** Update the length of the parent edge */
	$setLength(id: number, length: number): void;
}

/**
 * This is the readonly interface for {@link TreeNode}.
 */
export interface ITreeNode extends ISerializable<JEdge> {
	readonly id: number;
	readonly $parent: this | undefined;
	readonly $length: number;
	readonly $children: IReadonlyHeap<ITreeNode>;
	readonly $dist: number;
	readonly $isLeaf: boolean;
	readonly $AABB: AABB;
	readonly $tag: string;
	readonly $graphics: NodeGraphics;

	/** Used in {@link junctionTask} to clear junctions quicker. */
	readonly $leaves: readonly ITreeNode[];

	/** Set the position by a given {@link JFlap} */
	$setFlap(flap: JFlap): void;
}

export interface PatternContour extends Array<Point> {
	/**
	 * The {@link Repository.$signature} of the repo from which this path derives.
	 *
	 * Used for removing the path should the corresponding repo change
	 * (see {@link clearPatternContourForRepo}).
	 */
	$repo: string;

	/**
	 * The index in {@link NodeGraphics.$roughContours} associated with this contour,
	 * if available.
	 */
	$for?: number;

	/** Same as {@link NodeSet.$nodes}. */
	$ids: readonly number[];

	/** The ids of the wrapped leaves of the corresponding {@link RoughContour}. */
	$leaves?: readonly number[];
}

export interface NodeGraphics {
	/** See {@link RoughContour}. */
	$roughContours: RoughContour[];

	$patternContours: PatternContour[];

	/** The final contours. */
	$contours: Contour[];

	/** All ridge creases. */
	$ridges: ILine[];
}

/**
 * The contour of a flap/river without considering the stretch patterns.
 * Such contour consists of axis-aligned line segments only,
 * and can speed up the process of taking unions.
 *
 * Each instance of {@link RoughContour} should consist of a single connected region only.
 *
 * See also {@link roughContourTask}.
 */
export type RoughContour = ContourComponent<PathEx>;

export interface ContourComponent<T extends Path> {
	/**
	 * Outer path of the contour.
	 * Note that it is not of the same meaning as {@link Contour.outer}.
	 * In a {@link ContourComponent}, {@link $outer} is from the processing perspective
	 * (that is, it is the side of the river boundary facing away from the wrapped flaps),
	 * not from the rendering perspective (that is, it is graphically the outer path).
	 * Therefore, the outer paths are not necessarily counter-clockwise in orientation.
	 *
	 * In majority of cases there's only one outer path,
	 * but it could also contains newly formed holes,
	 * and in some edge cases of the raw mode,
	 * we may need to break up the outer path for the tracing algorithm to work.
	 */
	$outer: T[];

	/**
	 * Inner holes of the contour contributed by the child contours, if any.
	 * This does not include the newly formed holes.
	 *
	 * In most cases, this is the union of the outer paths of child contours.
	 * But in some cases we need to keep them separate,
	 * so that inserting the pattern contour may work properly.
	 *
	 * The same note of {@link $outer} also applies here.
	 */
	$inner: T[];

	/** The ids of the leaf nodes inside this {@link ContourComponent}. */
	$leaves: number[];

	/** Indicating that this {@link ContourComponent} is in raw mode. */
	$raw: boolean;
}
