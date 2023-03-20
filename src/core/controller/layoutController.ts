import { Design } from "core/design/design";
import { AABBTask } from "core/design/tasks/aabb";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { Clip } from "core/math/polyBool/clip/clip";
import { CreaseType } from "shared/types/cp";

import type { CPLine } from "shared/types/cp";
import type { ILine, Path, Polygon } from "shared/types/geometry";
import type { JFlap } from "shared/json";
import type { Stretch } from "core/design/layout/stretch";
import type { Repository } from "core/design/layout/repository";

//=================================================================
/**
 * {@link LayoutController} manages the operations on the layout.
 */
//=================================================================
namespace LayoutController {

	export function updateFlap(flaps: JFlap[], dragging: boolean): void {
		State.$isDragging = dragging;
		Design.$instance.$tree.$setFlaps(flaps);
		Processor.$run(AABBTask);
	}

	/**
	 * Clears the cached {@link Stretch}es and {@link Repository Repositories} after dragging.
	 *
	 * If we are not in dragging mode, those are never cached in the first place,
	 * so there is no need to clear the cache.
	 */
	export function dragEnd(): boolean {
		State.$isDragging = false;
		State.$stretchCache.clear();
		for(const stretch of State.$stretches.values()) stretch.$cleanup();
		return true; // So that updateModel is not processed.
	}

	/**
	 * Generate the set of {@link CPLine}s clipped to the given boundary.
	 */
	export function getCP(borders: Path): CPLine[] {
		const clip = new Clip();
		const tree = Design.$instance.$tree;
		const lines: CPLine[] = [];
		addPolygon(lines, [borders], CreaseType.Border);
		for(const node of tree.$nodes) {
			if(!node || !node.$parent) continue;
			// It suffices to include only the outer contours in CP exporting.
			addPolygon(lines, node.$graphics.$contours.map(c => c.outer), CreaseType.Auxiliary);
			addLines(lines, node.$graphics.$ridges, CreaseType.Mountains);
		}
		return clip.$get(lines);
	}

	function addPolygon(set: CPLine[], polygon: Polygon, type: CreaseType): void {
		if(!polygon) return;
		for(const path of polygon) {
			for(let i = 0; i < path.length; i++) {
				const p1 = path[i], p2 = path[(i + 1) % path.length];
				set.push([type, p1.x, p1.y, p2.x, p2.y]);
			}
		}
	}

	function addLines(set: CPLine[], lines: ILine[], type: CreaseType): void {
		for(const line of lines) {
			const [p1, p2] = line;
			set.push([type, p1.x, p1.y, p2.x, p2.y]);
		}
	}
}

export default LayoutController;
