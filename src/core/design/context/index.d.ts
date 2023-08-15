import type { Contour, ILine, Path, RoughContour } from "shared/types/geometry";
import type { AABB } from "./aabb/aabb";
import type { IHeap, IReadonlyHeap } from "shared/data/heap/heap";
import type { TreeNode } from "./treeNode";
import type { JEdge, JFlap } from "shared/json";
import type { Repository } from "../layout/repository";
import type { clearPatternContourForRepo } from "../tasks/patternContour";

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

	/** Returns the distance of two nodes on the tree */
	$dist(n1: ITreeNode, n2: ITreeNode): number;
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

	/** Set the position by a given {@link JFlap} */
	$setFlap(flap: JFlap): void;
}

export interface PatternContour extends Path {
	/**
	 * The {@link Repository.$signature} of the repo from which this path derives.
	 *
	 * Used for removing the path should the corresponding repo change
	 * (see {@link clearPatternContourForRepo}).
	 */
	repo?: string;
}

export interface NodeGraphics {
	/** The contours without considering patterns. */
	$roughContours: RoughContour[];

	$patternContours: PatternContour[];

	/** The final contours. */
	$contours: Contour[];

	/** All ridge creases. */
	$ridges: ILine[];
}
