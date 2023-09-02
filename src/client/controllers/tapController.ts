import ProjectService from "client/services/projectService";

const DURATION = 75;

//=================================================================
/**
 * {@link TapController} controls multiple tapping.
 */
//=================================================================
export namespace TapController {

	let tapCount: number = 0;
	let tapTimeout: number;

	export function $start(): void {
		tapCount = 1;
		tapTimeout = setTimeout($cancel, DURATION);
	}

	export function $record(count: number): void {
		if(tapCount && tapCount < count) tapCount = count;
	}

	export function $cancel(): void {
		clearTimeout(tapTimeout);
		tapCount = 0;
	}

	export function $process(): boolean {
		if(tapCount < 2) {
			tapCount = 0;
			return false;
		}

		const project = ProjectService.project.value;
		if(project) {
			if(tapCount == 2) project.history.$undo();
			else project.history.$redo();
		}
		tapCount = 0;
		return true;
	}
}
