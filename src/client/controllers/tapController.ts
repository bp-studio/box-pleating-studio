import ProjectService from "client/services/projectService";

const TWO = 100;
const THREE = 150;

//=================================================================
/**
 * {@link TapController} controls multiple tapping.
 */
//=================================================================
export namespace TapController {

	let tapCount: number = 0;
	let twoTimeout: number;
	let threeTimeout: number;

	export function $start(): void {
		tapCount = 1;
		twoTimeout = setTimeout(() => {
			if(tapCount >= 2) return;
			tapCount = 0;
			clearTimeout(threeTimeout);
		}, TWO);
		threeTimeout = setTimeout($cancel, THREE);
	}

	export function $record(count: number): void {
		if(tapCount && tapCount < count) tapCount = count;
	}

	export function $cancel(): void {
		clearTimeout(twoTimeout);
		clearTimeout(threeTimeout);
		tapCount = 0;
	}

	export function $process(): boolean {
		const tapped = tapCount >= 2;
		const project = ProjectService.project.value;
		if(tapped && project) {
			if(tapCount == 2) project.history.$undo();
			else project.history.$redo();
		}
		$cancel();
		return tapped;
	}
}
