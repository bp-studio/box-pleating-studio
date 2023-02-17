import { State } from "core/service/state";
import { Task } from "./task";

import type { InvalidJunction } from "../layout/junction/invalidJunction";

//=================================================================
/**
 * {@link invalidJunctionTask} calculates and maintains {@link InvalidJunction}s.
 */
//=================================================================
export const invalidJunctionTask = new Task(invalid);

function invalid(): void {
	for(const junction of State.$junctions.values()) {
		if(junction.$valid) continue;
		const a = junction.$a.id, b = junction.$b.id;
		State.$invalidJunctionDiff.$add(a, b);

		// If the same InvalidJunction has been drawn, there's no need to continue.
		if(junction.$processed) continue;

		// Calculate the shape of intersection.
		State.$updateResult.add.junctions[`${a},${b}`] = junction.$getPolygon();
	}

	// After the process above, the remaining ones are those that should be deleted.
	for(const [a, b] of State.$invalidJunctionDiff.$diff()) {
		State.$updateResult.remove.junctions.push(`${a},${b}`);
	}
}
