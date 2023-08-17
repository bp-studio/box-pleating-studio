import { AABBTask } from "core/design/tasks/aabb";
import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { Clip } from "core/math/polyBool/clip/clip";
import { CreaseType } from "shared/types/cp";
import { patternTask } from "core/design/tasks/pattern";

import type { CPLine } from "shared/types/cp";
import type { ILine, Path, Polygon } from "shared/types/geometry";
import type { JFlap, JStretch } from "shared/json";
import type { Stretch } from "core/design/layout/stretch";
import type { Repository } from "core/design/layout/repository";

//=================================================================
/**
 * {@link LayoutController} manages the operations on the layout.
 */
//=================================================================
export namespace LayoutController {

	/**
	 * Moving or resizing of flaps.
	 */
	export function updateFlap(flaps: JFlap[], dragging: boolean, prototypes: JStretch[]): void {
		State.$isDragging = dragging;
		State.$tree.$setFlaps(flaps);
		for(const json of prototypes) {
			State.$stretchPrototypes.set(json.id, json);
		}
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
		const tree = State.$tree;
		const lines: CPLine[] = [];
		addPolygon(lines, [borders], CreaseType.Border);
		for(const node of tree.$nodes) {
			if(!node || !node.$parent) continue;
			// It suffices to include only the outer contours in CP exporting.
			addPolygon(lines, node.$graphics.$contours.map(c => c.outer), CreaseType.Auxiliary);
			addLines(lines, node.$graphics.$ridges, CreaseType.Mountains);
		}
		for(const stretch of State.$stretches.values()) {
			const pattern = stretch.$repo.$pattern;
			if(!pattern) continue;
			for(const device of pattern.$devices) {
				addLines(lines, device.$drawRidges.map(l => l.$toILine()), CreaseType.Mountains);
				addLines(lines, device.$axisParallels, CreaseType.Valley);
			}
		}
		return clip.$get(lines);
	}

	export function switchConfig(stretchId: string, to: number): void {
		const stretch = State.$stretches.get(stretchId)!;
		stretch.$repo.$index = to;
		State.$repoUpdated.add(stretch.$repo);
		Processor.$run(patternTask);
	}

	export function switchPattern(stretchId: string, to: number): void {
		const stretch = State.$stretches.get(stretchId)!;
		stretch.$repo.$configuration!.$index = to;
		State.$repoUpdated.add(stretch.$repo);
		Processor.$run(patternTask);
	}

	export function moveDevice(stretchId: string, index: number, location: IPoint): void {
		const stretch = State.$stretches.get(stretchId)!;
		const device = stretch.$repo.$pattern!.$devices[index];
		device.$location = location;
		State.$movedDevices.add(device);
		State.$repoUpdated.add(stretch.$repo);
		Processor.$run(patternTask);
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

	function addLines(set: CPLine[], lines: readonly ILine[], type: CreaseType): void {
		for(const line of lines) {
			const [p1, p2] = line;
			set.push([type, p1.x, p1.y, p2.x, p2.y]);
		}
	}
}
