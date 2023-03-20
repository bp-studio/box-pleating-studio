import { Task } from "./task";
import { graphicsTask } from "./graphics";

import type { NodeGraphics } from "../context";

//=================================================================
/**
 * {@link patternContourTask} updates {@link NodeGraphics.$patternContours}.
 */
//=================================================================
export const patternContourTask = new Task(patternContour, graphicsTask);

function patternContour(): void {
	//TODO: generate pattern contours based on selected patterns and locations.
}
