import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { Clip } from "core/math/sweepLine/clip/clip";
import { CreaseType } from "shared/types/cp";
import { patternTask } from "core/design/tasks/pattern";

import type { CPLine } from "shared/types/cp";
import type { ILine, Path, Polygon } from "shared/types/geometry";
import type { JStretch } from "shared/json";
import type { Stretch } from "core/design/layout/stretch";
import type { Repository } from "core/design/layout/repository";

//=================================================================
/**
 * {@link LayoutController} manages the operations on the layout.
 */
//=================================================================
export namespace LayoutController {

	/**
	 * Clears the cached {@link Stretch}es and {@link Repository Repositories} after dragging.
	 *
	 * If we are not in dragging mode, those are never cached in the first place,
	 * so there is no need to clear the cache.
	 */
	export function dragEnd(): boolean {
		State.m.$isDragging = false;
		State.$stretchCache.clear();
		for(const stretch of State.$stretches.values()) stretch.$cleanup();
		return true; // So that updateModel is not processed.
	}

	/**
	 * Generate the set of {@link CPLine}s clipped to the given boundary.
	 */
	export function getCP(borders: Path, useAuxiliary: boolean = true): CPLine[] {
		const clip = new Clip();
		const tree = State.m.$tree;
		const lines: CPLine[] = [];
		addPolygon(lines, [borders], CreaseType.Border);
		for(const node of tree.$nodes) {
			if(!node || !node.$parent) continue;
			const hingeType = useAuxiliary ? CreaseType.Auxiliary : CreaseType.Valley;
			// It suffices to include only the outer contours in CP exporting.
			addPolygon(lines, node.$graphics.$contours.map(c => c.outer), hingeType);
			addLines(lines, node.$graphics.$ridges, CreaseType.Mountain);
		}
		for(const stretch of State.$stretches.values()) {
			const pattern = stretch.$repo.$pattern;
			if(!pattern) continue;
			for(const device of pattern.$devices) {
				addLines(lines, device.$drawRidges, CreaseType.Mountain);
				addLines(lines, device.$axisParallels, CreaseType.Valley);
			}
		}
		return clip.$get(lines);
	}

	/* istanbul ignore next: covered in practice */
	export function switchConfig(stretchId: string, to: number): void {
		const stretch = State.$stretches.get(stretchId)!;
		const repo = stretch.$repo;
		repo.$index = to;
		State.$repoToProcess.add(repo);
		Processor.$run(patternTask);
	}

	export function switchPattern(stretchId: string, to: number): void {
		const stretch = State.$stretches.get(stretchId)!;
		const repo = stretch.$repo;
		repo.$configuration!.$index = to;
		State.$repoToProcess.add(repo);
		Processor.$run(patternTask);
	}

	export function completeStretch(stretchId: string): JStretch | null {
		const stretch = State.$stretches.get(stretchId);

		// v0.7.6: It is possible that, after the user hit the delete command of vertices,
		// the user then select a Stretch BEFORE the delete command is completed.
		// In that case the stretch id will be invalid, leading to fatal error.
		// We safeguard this here.
		if(!stretch) return null;

		return stretch.$complete();
	}

	/* istanbul ignore next: covered in practice */
	export function moveDevice(stretchId: string, index: number, location: IPoint): void {
		const stretch = State.$stretches.get(stretchId)!;
		const repo = stretch.$repo;
		const device = repo.$pattern!.$devices[index];
		device.$location = location;
		State.$movedDevices.add(device);
		State.$repoToProcess.add(repo);
		Processor.$run(patternTask);
	}

	function addPolygon(set: CPLine[], polygon: Polygon, type: CreaseType): void {
		for(const path of polygon) {
			const l = path.length;
			for(let i = 0; i < l; i++) {
				const p1 = path[i], p2 = path[i + 1] || path[0];
				set.push({ type, p1, p2 });
			}
		}
	}

	function addLines(set: CPLine[], lines: readonly ILine[], type: CreaseType): void {
		for(const line of lines) {
			const [p1, p2] = line;
			set.push({ type, p1, p2 });
		}
	}
}
