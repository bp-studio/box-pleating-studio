import { IntDoubleMap } from "shared/data/doubleMap/intDoubleMap";
import { DiffDoubleSet } from "shared/data/diff/diffDoubleSet";
import { DiffSet } from "shared/data/diff/diffSet";
import { UpdateResult } from "./updateResult";

import type { Repository } from "core/design/layout/repository";
import type { Device } from "core/design/layout/pattern/device";
import type { JStretch, NodeId } from "shared/json";
import type { Stretch } from "core/design/layout/stretch";
import type { Junction } from "core/design/layout/junction/junction";
import type { InvalidJunction } from "core/design/layout/junction/invalidJunction";
import type { ITreeNode, PatternContour } from "core/design/context";
import type { Tree } from "core/design/context/tree";

//=================================================================
/**
 * {@link State} manages the data that are passed around during the updating process.
 */
//=================================================================

export namespace State {

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Persistent states
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Current {@link Tree}. */
	export let $tree: Tree;

	/** All {@link Junction}s. */
	export const $junctions = new IntDoubleMap<NodeId, Junction>();

	/** All {@link Stretch}es. */
	export const $stretches = new Map<string, Stretch>();

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Semi-persistent states
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** If the Client is performing dragging. Some of the tasks could take a shortcut in that case. */
	export let $isDragging: boolean;

	/** Used for finding those {@link InvalidJunction}s that needs to be deleted. */
	export const $invalidJunctionDiff = new DiffDoubleSet();

	/** Used for finding those {@link Stretch}es that need to be deleted. */
	export const $stretchDiff = new DiffSet<string>();

	/** {@link Stretch} cache during dragging. */
	export const $stretchCache = new Map<string, Stretch>();

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Temporary states
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/**
	 * Those nodes that have children changed (or initialized) in the current round,
	 * except for those that are deleted later.
	 */
	export const $childrenChanged = new Set<ITreeNode>();

	/**
	 * Those nodes that have parent changed (or initialized) in the current round,
	 * except for the final root node.
	 */
	export const $parentChanged = new Set<ITreeNode>();

	/** Root have changed in the current round. */
	export let $rootChanged: boolean;

	/** The structure of the tree (not the edge lengths) have changed. */
	export let $treeStructureChanged: boolean;

	/**
	 * Those nodes that have the length of their parent edges changed in the current round,
	 * except for those that are already in {@link $parentChanged}.
	 */
	export const $lengthChanged = new Set<ITreeNode>();

	/**
	 * Those nodes that have any {@link AABB} changed in its subtree in the current round,
	 * for determining if re-scanning for collision is necessary.
	 */
	export const $subtreeAABBChanged = new Set<ITreeNode>();

	/** Those nodes that have their {@link ITreeNode.$AABB AABB} proactively changed in the current round. */
	export const $nodeAABBChanged = new Set<ITreeNode>();

	/**
	 * Those flaps that have any type of changes in the current round,
	 * that is, those flaps that are in {@link $subtreeAABBChanged}.
	 */
	export const $flapChanged = new Set<ITreeNode>();

	/** The new {@link Repository Repositories} formed in the current round. */
	export const $newRepositories = new Set<Repository>();

	/**
	 * The {@link Repository Repositories} that needs to recalculate {@link PatternContour} for all related nodes in the current round.
	 */
	export const $repoToProcess = new Set<Repository>();

	/**
	 * The {@link Repository Repositories} that needs to recalculate {@link PatternContour} for only some of the related nodes in the current round,
	 * excluding those that are already in {@link $repoToProcess}.
	 */
	export const $repoToPartiallyProcess = new Map<Repository, ITreeNode[]>();

	/**
	 * The {@link Repository Repositories} with changes in its {@link NodeSet},
	 * excluding those that are already in {@link $repoToProcess}.
	 */
	export const $repoWithNodeSetChanged = new Set<Repository>();

	/** The prototypes of those {@link Stretch}es that are expected to form int the current round. */
	export const $stretchPrototypes = new Map<string, JStretch>();

	/**
	 * Those {@link ITreeNode}s that has its {@link ITreeNode.$roughContours} changed in the current round.
	 */
	export const $roughContourChanged = new Set<ITreeNode>();

	/** Those flaps or rivers that will change their contours in the current round. */
	export const $contourWillChange = new Set<ITreeNode>();

	/** The quadrants that have patterns. */
	export const $patternedQuadrants = new Set<number>();

	/** The {@link Device}s moved (or initialized) in the current round. */
	export const $movedDevices = new Set<Device>();

	/////////////////////////////////////////////////////////////////////////////////////////////////////
	// Public methods
	/////////////////////////////////////////////////////////////////////////////////////////////////////

	/** Reset the temporary states after each round. */
	export function $reset(): void {
		$childrenChanged.clear();
		$parentChanged.clear();
		$lengthChanged.clear();
		$subtreeAABBChanged.clear();
		$nodeAABBChanged.clear();
		$flapChanged.clear();
		$newRepositories.clear();
		$repoToProcess.clear();
		$repoToPartiallyProcess.clear();
		$repoWithNodeSetChanged.clear();
		$stretchPrototypes.clear();
		$roughContourChanged.clear();
		$contourWillChange.clear();
		$patternedQuadrants.clear();
		$movedDevices.clear();
		$treeStructureChanged = false;
		$rootChanged = false;
	}

	$reset();
}

/** For unit tests only */
export function fullReset(): void {
	State.$reset();
	UpdateResult.$flush();
	State.$junctions.clear();
	State.$stretches.clear();
	State.$invalidJunctionDiff.clear();
	State.$stretchDiff.clear();
	State.$stretchCache.clear();
}
