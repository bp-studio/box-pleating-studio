import { Task } from "./task";
import { graphicsTask } from "./graphics";
import { State } from "core/service/state";

import type { NodeGraphics } from "../context";

//=================================================================
/**
 * {@link patternContourTask} updates {@link NodeGraphics.$patternContours}.
 */
//=================================================================
export const patternContourTask = new Task(patternContour, graphicsTask);

function patternContour(): void {

	for(const device of State.$movedDevices) device.$updateAnchors();

	//TODO: generate pattern contours based on selected patterns and locations.
}
