import { State } from "core/service/state";
import { Task } from "./task";

import type { Configuration } from "../layout/configuration";
import type { Pattern } from "../layout/pattern/pattern";

//=================================================================
/**
 * {@link patternTask} find all possible {@link Configuration}s and {@link Pattern}s.
 */
//=================================================================
export const patternTask = new Task(pattern);

function pattern(): void {
	for(const repo of State.$newRepositories.values()) repo.$init();
}
