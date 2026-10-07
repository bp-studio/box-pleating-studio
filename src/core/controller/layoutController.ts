import { Processor } from "core/service/processor";
import { State } from "core/service/state";
import { patternTask } from "core/design/tasks/pattern";
import { getGenericCP } from "core/design/cp/genericCP";

import type { GenericCPLine } from "shared/types/cp";
import type { Path } from "shared/types/geometry";
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
	 * Clears the cached {@link Stretch}es and {@link Repository Repositories}
	 * after dragging.
	 *
	 * If we are not in dragging mode, those are never cached in the first
	 * place, so there is no need to clear the cache.
	 */
	export function dragEnd(): boolean {
		State.m.$isDragging = false;
		State.$stretchCache.clear();
		for(const stretch of State.$stretches.values()) stretch.$cleanup();
		return true; // So that updateModel is not processed.
	}

	/**
	 * Generate the generic CP clipped to the given boundary
	 * (see {@link getGenericCP}).
	 */
	export function getCP(borders: Path): GenericCPLine[] {
		return getGenericCP(borders);
	}

	export /* istanbul ignore next: covered in practice */
	function switchConfig(stretchId: string, to: number): void {
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

		// v0.7.6: It is possible that, after the user hit the delete command of
		// vertices, the user then select a Stretch BEFORE the delete command is
		// completed. In that case the stretch id will be invalid, leading to
		// fatal error. We safeguard this here.
		if(!stretch) return null;

		return stretch.$complete();
	}

	export /* istanbul ignore next: covered in practice */
	function moveDevice(
		stretchId: string, index: number, location: IPoint
	): void {
		const stretch = State.$stretches.get(stretchId)!;
		const repo = stretch.$repo;
		const device = repo.$pattern!.$devices[index];
		device.$location = location;
		State.$movedDevices.add(device);
		State.$repoToProcess.add(repo);
		Processor.$run(patternTask);
	}
}
