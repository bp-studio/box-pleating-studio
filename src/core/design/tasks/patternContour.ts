import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";
import { MASK } from "../layout/junction/validJunction";

import type { NodeGraphics } from "../context";

//=================================================================
/**
 * {@link patternContourTask} updates {@link NodeGraphics.$patternContours}.
 */
//=================================================================
export const patternContourTask = new Task(patternContour, graphicsTask);

function patternContour(): void {
	//TODO: generate pattern contours based on selected patterns and locations.

	// Reset
	for(const node of State.$contourWillChange) {
		node.$graphics.$patternContours = [];
	}

	for(const repo of State.$repoUpdated) {

		if(!repo.$configuration) continue;

		for(const code of repo.$quadrants) {
			const q = code & MASK;
			const id = code >>> 2;
			const node = State.$tree.$nodes[id]!;

			// POC
			const corner = node.$AABB.$toPath()[q];
			if(q == 0) {
				node.$graphics.$patternContours.push([
					{ x: corner.x, y: corner.y - 1 },
					{ x: corner.x - 1, y: corner.y },
				]);
			}
			if(q == 1) {
				node.$graphics.$patternContours.push([
					{ x: corner.x + 1, y: corner.y },
					{ x: corner.x, y: corner.y - 1 },
				]);
			}
			if(q == 2) {
				node.$graphics.$patternContours.push([
					{ x: corner.x, y: corner.y + 1 },
					{ x: corner.x + 1, y: corner.y },
				]);
			}
			if(q == 3) {
				node.$graphics.$patternContours.push([
					{ x: corner.x - 1, y: corner.y },
					{ x: corner.x, y: corner.y + 1 },
				]);
			}
		}
	}

}
