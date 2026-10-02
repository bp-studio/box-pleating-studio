import { Task } from "./task";
import { climb } from "./utils/climb";
import { State } from "core/service/state";
import { traceContourTask } from "./traceContour";
import { simplify } from "./utils/expand";
import { RoughUnion } from "core/math/sweepLine/polyBool/aaUnion/roughUnion";
import { carveLeaf, expandOuter, fitsAt, getInvasions, getNewCarvings, radius, rebuild, updateInvasions } from "./utils/invasion";

import type { ValidJunction } from "../layout/junction/validJunction";
import type { NodeId } from "shared/json/tree";
import type { UnionResult } from "core/math/sweepLine/polyBool/aaUnion/roughUnion";
import type { ITreeNode, NodeGraphics, RoughContour } from "../context";
import type { junctionTask } from "./junction";

const roughUnion = new RoughUnion();

/**
 * The signature of the invasions of each leaf in the previous run,
 * for detecting changes.
 */
const invasionCache = new Map<NodeId, string>();

//=================================================================
/**
 * {@link roughContourTask} updates {@link NodeGraphics.$roughContours}.
 *
 * A {@link RoughContour} is the contour of a flap/river without considering the
 * stretch patterns. Such contour consists of axis-aligned line segments only,
 * and can speed up the process of taking unions.
 * It depends only on the AABB hierarchy, except for the "invasions"
 * (see {@link ValidJunction.$invasion}) which are carved out of the leaves,
 * so this task runs after {@link junctionTask}.
 *
 * An invasion is carved only from the level where it fits the quadrant of the
 * expanded leaf (see {@link fitsAt}). Before that level, the leaf is kept in
 * {@link RoughContour.$pending}, and at that level, the region of the leaf is
 * rebuilt from its expanded hinge rectangle (see {@link rebuild}).
 *
 * Each instance of rough contour should consist of a single connected region
 * only.
 */
//=================================================================
export const roughContourTask = new Task(roughContour, traceContourTask);

function roughContour(): void {
	climb(updater,
		State.$nodeAABBChanged,
		State.$parentChanged,
		State.$childrenChanged,
		State.$lengthChanged,
		updateInvasionMap()
	);
}

/**
 * Update the invasions of the leaves,
 * and return the leaves whose invasions have changed.
 *
 * Note that the carving takes place regardless of whether the junction is
 * resolved by a stretch pattern. We had tried carving only for the corners
 * resolved by patterns (which requires this task to run after
 * {@link patternTask}), but it turned out that the rivers wrapping around the
 * flaps look more logical if the carving always takes place. The default flap
 * ridges in the carved quadrants without patterns are omitted instead (see
 * {@link graphicsTask}).
 */
function updateInvasionMap(): Set<ITreeNode> {
	const junctions = [...State.$junctions.values()]
		.filter(j => j.$valid) as ValidJunction[];
	updateInvasions(junctions);

	const changed = new Set<ITreeNode>();
	const ids = new Set(invasionCache.keys());
	for(const j of junctions) if(j.$invasion) ids.add(j.$invasion.flap.id);
	for(const id of ids) {
		const signature = getInvasions(id)
			.map(i => [i.invader.id, i.q, i.o.x, i.o.y].join(","))
			.sort().join(";");
		if(invasionCache.get(id) === signature) continue;
		if(signature) invasionCache.set(id, signature);
		else invasionCache.delete(id);
		const node = State.m.$tree.$nodes[id];
		if(node) changed.add(node);
	}
	return changed;
}

function updater(node: ITreeNode): boolean {
	if(!node.$parent) {
		// The root has no parent edge and therefore no rough contour of its
		// own. Clear any contour it held as a former non-root, so that no
		// stale contour referencing its previous subtree survives.
		node.$graphics.$roughContours = [];
		return false;
	}
	if(node.$isLeaf) {
		// Base case
		const r = node.$length;
		const invasions = getInvasions(node.id);
		const outer = invasions.some(i => fitsAt(i, r)) ?
			carveLeaf(node, r) : [node.$AABB.$toPath()];
		const contour: RoughContour = {
			$id: node.id,
			$outer: outer,
			$children: [],
			$leaves: [node.id],
		};
		if(invasions.some(i => !fitsAt(i, r))) contour.$pending = [node.id];
		node.$graphics.$roughContours = [contour];
	} else {
		const children =
			[...node.$children].flatMap(c => c.$graphics.$roughContours);
		const contours = expand(children, node.$length, node.id);
		node.$graphics.$roughContours = contours;
	}
	State.$roughContourChanged.add(node);

	// For the moment, there is no concrete evidence that comparing the
	// changes of contours here will help improving overall performance,
	// so we always return true and continue on the parent regardlessly.
	return true;
}

/**
 * Expand the given AA polygon by given units,
 * and generate contours matching outer and inner paths.
 */
export function expand(
	inputs: readonly RoughContour[], units: number, id = 0 as NodeId
): RoughContour[] {
	const components = roughUnion.$union(...inputs.map(c => {
		// The pending leaves that are carved at this level for the first time
		const targets = getNewCarvings(c, units);
		return targets.length ?
			rebuild(c, new Set(targets), units, units) : expandOuter(c, units);
	}));

	const contours: RoughContour[] = [];
	for(const component of components) {
		contours.push(componentToContour(id, inputs, component, units));
	}
	return contours;
}

function componentToContour(
	id: NodeId, inputs: readonly RoughContour[], component: UnionResult,
	units: number
): RoughContour {
	const outers = component.paths.map(simplify);
	const children = component.from.map(i => inputs[i]);
	const leaves = children.flatMap(c => c.$leaves);
	const contour: RoughContour = {
		$id: id, $outer: outers, $children: children, $leaves: leaves,
	};
	const pending = children.flatMap(c => (c.$pending ?? []).filter(
		l => getInvasions(l).some(i => !fitsAt(i, radius(l, c) + units))
	));
	if(pending.length) contour.$pending = pending;
	return contour;
}
